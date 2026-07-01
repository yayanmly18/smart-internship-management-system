const db = require("../integrations/database.client");
const starlark = require("../engine/starlark.engine");
const vrule = require("./vrule.service");
const nats = require("./nats.service");
const audit = require("./audit.service");
const vflow = require("../integrations/vflow.client");
const vflowLogger = require("../integrations/vflow-logger");

// ================================================================
// VFLOW → EXPRESS FALLBACK DISPATCHER
// Setiap workflow dicoba ke VFlow dulu. Jika VFlow gagal (error,
// empty response, timeout), fallback otomatis ke implementasi lokal.
// ================================================================

// Mapping workflow name → VFlow webhook path
const VFLOW_WORKFLOW_PATHS = {
  wf_registration:          vflow.config.paths.registration,
  wf_eligibility:           vflow.config.paths.eligibility,
  wf_admin_verification:    vflow.config.paths.adminVerify,
  wf_approval:              vflow.config.paths.approval,
  wf_company_placement:     vflow.config.paths.placement,
  wf_progress_monitoring:   vflow.config.paths.progress,
  wf_performance_evaluation: vflow.config.paths.evaluation,
  wf_certification:         vflow.config.paths.certification,
};

/**
 * Coba trigger workflow via VFlow.
 * Return null jika VFlow disabled, tidak ada path, atau response kosong/error.
 * Return result object jika berhasil.
 */
async function tryVFlow(workflowName, payload) {
  if (!vflow.config.enabled || vflow.config.mode === 'local') {
    vflowLogger.skipped(workflowName);
    return null;
  }

  const wfPath = VFLOW_WORKFLOW_PATHS[workflowName];
  if (!wfPath) return null; // No VFlow mapping, use local directly

  try {
    const result = await vflow.triggerWebhook(wfPath, payload);

    // VFlow returned a response — check if it has real data
    if (result && result.ok) {
      const data = result.data;
      // If data is an object with status field, treat as successful VFlow response
      if (data && typeof data === 'object' && (data.status || data.workflow)) {
        vflowLogger.success(wfPath, { statusCode: result.statusCode });
        return { ...data, source: 'vflow', _rawBytes: result.rawBytes };
      }
      // If rawBytes === 0, VFlow returned empty body — fallback
      if (result.rawBytes === 0) {
        vflowLogger.fail(wfPath, new Error('VFlow returned empty body (0 bytes) — SSE proxy issue'));
        return null;
      }
    }

    // skipped/disabled
    return null;
  } catch (err) {
    vflowLogger.fail(wfPath, err);
    return null; // Trigger fallback
  }
}

// ================================================================
// WORKFLOW ENGINE - All 7 Internship Workflows (Local Implementations)
// ================================================================

/**
 * Workflow 1: Internship Registration
 * Menerima pendaftaran magang dari mahasiswa
 */
async function wf_registration(payload) {
  const { name, nim, email, prodi, year, phone, motivation, skills } = payload;
  
  console.log('[WF_REGISTRATION] Received:', { name, nim, email });
  
  if (!email) {
    console.log('[WF_REGISTRATION] FAIL: email missing');
    return { workflow: 'wf_registration', status: 'failed', message: 'Email diperlukan' };
  }

  // 1. Validasi data
  if (!name || !nim) {
    console.log('[WF_REGISTRATION] FAIL: name or nim missing');
    return { workflow: 'wf_registration', status: 'failed', message: 'Nama dan NIM diperlukan' };
  }

  // 2. Cek apakah user sudah terdaftar
  const user = await db.get('SELECT id, email FROM users WHERE email = ?', [email]);
  if (!user) {
    console.log('[WF_REGISTRATION] FAIL: user not found for email', email);
    return { workflow: 'wf_registration', status: 'failed', message: 'User tidak ditemukan. Silakan register terlebih dahulu.' };
  }

  console.log('[WF_REGISTRATION] User found:', user.email, 'id=', user.id);

  // 3. Cek apakah sudah punya internship aktif (skip null-name corrupted ones)
  const existing = await db.get(
    "SELECT id, status, name FROM internships WHERE user_email = ? AND status NOT IN ('selesai', 'ditolak') ORDER BY created_at DESC LIMIT 1",
    [email]
  );
  if (existing) {
    // Auto-delete corrupted internship (null name)
    if (!existing.name) {
      console.log('[WF_REGISTRATION] Auto-deleting corrupted internship id=', existing.id);
      await db.run('DELETE FROM internships WHERE id=?', [existing.id]);
    } else {
      console.log('[WF_REGISTRATION] FAIL: active internship exists id=', existing.id);
      return { workflow: 'wf_registration', status: 'failed', message: 'Anda sudah memiliki pendaftaran magang yang aktif', internshipId: existing.id };
    }
  }

  // 4. Buat Internship ID (auto-increment dari SQLite)
  const skillsStr = Array.isArray(skills) ? skills.join(',') : (skills || '');
  const result = await db.run(
    `INSERT INTO internships (user_email, name, nim, prodi, year, phone, motivation, skills, status, progress) 
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [email, name, nim, prodi, year, phone, motivation, skillsStr, 'pending', 0]
  );

  const internshipId = result.id;
  console.log('[WF_REGISTRATION] SUCCESS: internshipId=', internshipId);

  // 5. Detach Activity - Mencatat log registrasi
  await audit.log({ action: 'REGISTER_INTERNSHIP', data: { internshipId, email, name, nim }, userId: user.id });

  // 6. Event InternshipSubmitted dikirim ke workflow berikutnya
  await nats.publish('InternshipSubmitted', { internshipId, email, name, nim, skills: skillsStr });

  return {
    workflow: 'wf_registration',
    status: 'executed',
    data: {
      internshipId,
      registrationStatus: 'pending',
      message: 'Pendaftaran berhasil, menunggu proses seleksi'
    }
  };
}

/**
 * Workflow 2: Eligibility Assessment
 * Menentukan kelayakan peserta magang
 */
async function wf_eligibility(payload) {
  const { internshipId } = payload;
  
  if (!internshipId) {
    return { workflow: 'wf_eligibility', status: 'failed', message: 'internshipId diperlukan' };
  }

  // 1. Ambil data mahasiswa dari internship
  const internship = await db.get('SELECT * FROM internships WHERE id = ?', [internshipId]);
  if (!internship) {
    return { workflow: 'wf_eligibility', status: 'failed', message: 'Internship tidak ditemukan' };
  }

  // Ambil data user
  const user = await db.get('SELECT * FROM users WHERE email = ?', [internship.user_email]);
  if (!user) {
    return { workflow: 'wf_eligibility', status: 'failed', message: 'User tidak ditemukan' };
  }

  // Parse skills
  const skillList = internship.skills ? internship.skills.split(',').map(s => s.trim()) : [];
  const certCount = internship.certificates ? internship.certificates.split(',').length : 0;

  // 2. Siapkan data untuk Starlark Assessment
  const assessmentData = {
    gpa: user.gpa || 3.0,
    semester: user.semester || 1,
    certificate_count: certCount,
    organization_exp: user.organization_exp || 0,
    skills: skillList
  };

  // 3. Jalankan Starlark Assessment
  const eligibility = starlark.executeEligibility(assessmentData);

  // 4. Evaluasi VRule eligibility_check
  const rule = await vrule.evaluate('vrule_eligibility_check', {
    userId: user.id,
    gpa: user.gpa,
    semester: user.semester
  });

  // 5. Simpan hasil assessment ke DB
  await db.run(
    'INSERT INTO assessments (internship_id, assessment_type, score, result) VALUES (?,?,?,?)',
    [internshipId, 'eligibility', eligibility.score, JSON.stringify(eligibility)]
  );

  // Update internship dengan skor kelayakan
  const isEligible = eligibility.eligible && rule.passed;
  await db.run(
    'UPDATE internships SET eligibility_score = ?, eligibility_passed = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [eligibility.score, isEligible ? 1 : 0, isEligible ? 'seleksi' : 'ditolak', internshipId]
  );

  // 6. Detach Activity - menyimpan hasil assessment
  await audit.log({
    action: 'ELIGIBILITY_ASSESSMENT',
    data: { internshipId, score: eligibility.score, eligible: isEligible, rule: rule.passed },
    internshipId
  });

  // Jika eligible, publish event untuk workflow berikutnya
  if (isEligible) {
    await nats.publish('EligibilityPassed', { internshipId, score: eligibility.score, recommendation: 'Lulus seleksi kelayakan' });
  }

  return {
    workflow: 'wf_eligibility',
    status: 'executed',
    data: {
      internshipId,
      eligibilityScore: eligibility.score,
      eligible: isEligible,
      recommendation: isEligible ? 'Layak' : 'Tidak layak',
      ruleEvaluation: rule
    }
  };
}

/**
 * Workflow 3: Supervisor Approval
 * Melakukan persetujuan pembimbing
 */
async function wf_approval(payload) {
  const { internshipId, action: approvalAction, pembimbingEmail } = payload;

  if (!internshipId) {
    return { workflow: 'wf_approval', status: 'failed', message: 'internshipId diperlukan' };
  }

  const internship = await db.get('SELECT * FROM internships WHERE id = ?', [internshipId]);
  if (!internship) {
    return { workflow: 'wf_approval', status: 'failed', message: 'Internship tidak ditemukan' };
  }

  // Jika approval action diberikan (approve/reject)
  if (approvalAction) {
    if (approvalAction === 'approve') {
      // Set pembimbing dan update status
      const pembimbingEmailToUse = pembimbingEmail || internship.pembimbing_email;
      if (!pembimbingEmailToUse) {
        return { workflow: 'wf_approval', status: 'failed', message: 'Pembimbing belum ditentukan' };
      }

      // Cek VRule approval_requirement
      await db.run('UPDATE internships SET pembimbing_email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
        [pembimbingEmailToUse, internshipId]);

      const rule = await vrule.evaluate('vrule_approval_requirement', { internshipId });

      if (rule.passed) {
        await db.run('UPDATE internships SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['approved', internshipId]);
        
        // Detach Activity - menyimpan audit trail
        await audit.log({ action: 'SUPERVISOR_APPROVED', data: { internshipId, pembimbing: pembimbingEmailToUse }, internshipId });
        await nats.publish('SupervisorApproved', { internshipId, pembimbing: pembimbingEmailToUse });

        return {
          workflow: 'wf_approval',
          status: 'executed',
          data: { internshipId, approved: true, pembimbing: pembimbingEmailToUse, message: 'Disetujui oleh pembimbing' }
        };
      } else {
        return {
          workflow: 'wf_approval',
          status: 'failed',
          data: { internshipId, approved: false, message: 'Persyaratan approval belum terpenuhi', checks: rule.checks }
        };
      }
    } else if (approvalAction === 'reject') {
      await db.run('UPDATE internships SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['ditolak', internshipId]);
      await audit.log({ action: 'SUPERVISOR_REJECTED', data: { internshipId, reason: payload.reason || 'Ditolak oleh pembimbing' }, internshipId });
      
      return {
        workflow: 'wf_approval',
        status: 'executed',
        data: { internshipId, approved: false, message: 'Ditolak oleh pembimbing' }
      };
    }
  }

  // Jika hanya cek status approval
  const rule = await vrule.evaluate('vrule_approval_requirement', { internshipId });
  
  return {
    workflow: 'wf_approval',
    status: rule.passed ? 'ready' : 'waiting',
    data: {
      internshipId,
      requiresApproval: true,
      canProceed: rule.passed,
      currentPembimbing: internship.pembimbing_email || null,
      message: rule.passed ? 'Siap untuk approval' : 'Menunggu penunjukan pembimbing'
    }
  };
}

/**
 * Workflow 4: Company Placement Engine
 * Menentukan perusahaan yang sesuai
 */
async function wf_company_placement(payload) {
  const { internshipId, companyId } = payload;

  if (!internshipId) {
    return { workflow: 'wf_company_placement', status: 'failed', message: 'internshipId diperlukan' };
  }

  const internship = await db.get('SELECT * FROM internships WHERE id = ?', [internshipId]);
  if (!internship) {
    return { workflow: 'wf_company_placement', status: 'failed', message: 'Internship tidak ditemukan' };
  }

  const skillList = internship.skills ? internship.skills.split(',').map(s => s.trim()) : [];

  // Jika companyId diberikan, assign langsung
  if (companyId) {
    const company = await db.get('SELECT * FROM companies WHERE id = ?', [companyId]);
    if (!company) {
      return { workflow: 'wf_company_placement', status: 'failed', message: 'Perusahaan tidak ditemukan' };
    }

    // VRule company matching
    const rule = await vrule.evaluate('vrule_company_matching', {
      studentSkills: skillList,
      companyBidang: company.bidang
    });

    // Simpan placement
    await db.run(
      'INSERT INTO placements (internship_id, company_id, company_name, match_score, status) VALUES (?,?,?,?,?)',
      [internshipId, company.id, company.name, rule.matchScore, 'placed']
    );

    // Update internship
    await db.run(
      'UPDATE internships SET company = ?, company_bidang = ?, match_score = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [company.name, company.bidang, rule.matchScore, 'aktif', internshipId]
    );

    // Log
    await audit.log({ action: 'COMPANY_PLACEMENT', data: { internshipId, company: company.name, matchScore: rule.matchScore }, internshipId });
    await nats.publish('CompanyPlaced', { internshipId, company: company.name, matchScore: rule.matchScore });

    return {
      workflow: 'wf_company_placement',
      status: 'executed',
      data: {
        internshipId,
        company: company.name,
        companyBidang: company.bidang,
        matchScore: rule.matchScore,
        message: `Ditempatkan di ${company.name}`
      }
    };
  }

  // Auto-matching: cari perusahaan terbaik
  const companies = await db.all('SELECT * FROM companies ORDER BY quota DESC');
  
  let bestMatch = null;
  let bestScore = 0;

  for (const company of companies) {
    const rule = await vrule.evaluate('vrule_company_matching', {
      studentSkills: skillList,
      companyBidang: company.bidang
    });

    if (rule.matchScore > bestScore) {
      bestScore = rule.matchScore;
      bestMatch = company;
    }
  }

  return {
    workflow: 'wf_company_placement',
    status: 'executed',
    data: {
      internshipId,
      recommendedCompany: bestMatch ? { name: bestMatch.name, bidang: bestMatch.bidang, score: bestScore } : null,
      allCompanies: companies.map(c => ({ name: c.name, bidang: c.bidang, quota: c.quota })),
      message: bestMatch ? `Rekomendasi: ${bestMatch.name} (skor: ${bestScore}%)` : 'Tidak ada perusahaan yang cocok'
    }
  };
}

/**
 * Workflow 5: Weekly Progress Monitoring
 * Monitoring aktivitas magang
 */
async function wf_progress_monitoring(payload) {
  const { internshipId, week, note, userId } = payload;

  if (!internshipId && !userId) {
    return { workflow: 'wf_progress_monitoring', status: 'failed', message: 'internshipId atau userId diperlukan' };
  }

  // Cari internshipId dari userId jika tidak diberikan
  let targetInternshipId = internshipId;
  if (!targetInternshipId && userId) {
    const user = await db.get('SELECT email FROM users WHERE id = ?', [userId]);
    if (user) {
      const internship = await db.get(
        'SELECT id FROM internships WHERE user_email = ? ORDER BY created_at DESC LIMIT 1',
        [user.email]
      );
      targetInternshipId = internship?.id;
    }
  }

  if (!targetInternshipId) {
    return { workflow: 'wf_progress_monitoring', status: 'failed', message: 'Internship tidak ditemukan' };
  }

  const internship = await db.get('SELECT * FROM internships WHERE id = ?', [targetInternshipId]);
  if (!internship) {
    return { workflow: 'wf_progress_monitoring', status: 'failed', message: 'Internship tidak ditemukan' };
  }

  // 1. Simpan laporan
  let reportResult = null;
  if (week) {
    reportResult = await db.run(
      'INSERT INTO reports (internship_id, week, note) VALUES (?,?,?)',
      [targetInternshipId, week, note || null]
    );
  }

  // 2. Validasi laporan via VRule
  const complianceRule = await vrule.evaluate('vrule_progress_compliance', { internshipId: targetInternshipId });

  // 3. Update progress berdasarkan jumlah laporan
  const reportCount = await db.get('SELECT COUNT(*) as count FROM reports WHERE internship_id = ?', [targetInternshipId]);
  const progress = Math.min(100, Math.round(((reportCount?.count || 0) / 8) * 100));
  const newStatus = progress >= 100 ? 'selesai' : 'aktif';

  await db.run(
    'UPDATE internships SET progress = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [progress, newStatus, targetInternshipId]
  );

  // 4. Detach Activity - menyimpan log
  await audit.log({ action: 'WEEKLY_REPORT', data: { internshipId: targetInternshipId, week, progress }, internshipId: targetInternshipId });

  // 5. Publish event ProgressUpdated
  await nats.publish('ProgressUpdated', {
    internshipId: targetInternshipId,
    week,
    progress,
    compliance: complianceRule.compliance
  });

  return {
    workflow: 'wf_progress_monitoring',
    status: 'executed',
    data: {
      internshipId: targetInternshipId,
      week: week || null,
      progress,
      internshipStatus: newStatus,
      compliance: complianceRule.compliance,
      totalReports: reportCount?.count || 0,
      reportId: reportResult?.id || null
    }
  };
}

/**
 * Workflow 6: Performance Evaluation
 * Menghitung nilai akhir magang
 */
async function wf_performance_evaluation(payload) {
  const { internshipId } = payload;

  if (!internshipId) {
    return { workflow: 'wf_performance_evaluation', status: 'failed', message: 'internshipId diperlukan' };
  }

  const internship = await db.get('SELECT * FROM internships WHERE id = ?', [internshipId]);
  if (!internship) {
    return { workflow: 'wf_performance_evaluation', status: 'failed', message: 'Internship tidak ditemukan' };
  }

  // Ambil feedbacks untuk mahasiswa ini
  const feedbacks = await db.all(
    'SELECT score FROM feedbacks WHERE internship_id = ?',
    [internshipId]
  );

  // Hitung komponen nilai
  const reportCount = await db.get('SELECT COUNT(*) as count FROM reports WHERE internship_id = ?', [internshipId]);

  // Attendance score (default 90 jika aktif)
  const attendance = internship.status === 'selesai' || internship.status === 'aktif' ? 90 : 0;

  // Weekly report score (based on completion)
  const weeklyReport = reportCount?.count || 0;
  const reportScore = Math.min(100, (weeklyReport / 8) * 100);

  // Supervisor score (average from feedbacks)
  const supervisorScore = feedbacks.length > 0
    ? Math.round(feedbacks.reduce((s, f) => s + (f.score || 0), 0) / feedbacks.length)
    : 0;

  // Company score (default based on status)
  const companyScore = internship.status === 'selesai' ? 85 : (internship.status === 'aktif' ? 75 : 0);

  // 1. Jalankan Starlark Grading
  const grading = starlark.executeGrading(attendance, reportScore, supervisorScore, companyScore);

  // 2. Evaluasi VRule performance grading
  const gradeRule = await vrule.evaluate('vrule_performance_grading', { finalScore: grading.final_score });

  // 3. Simpan hasil ke database
  await db.run(
    'INSERT INTO assessments (internship_id, assessment_type, score, result) VALUES (?,?,?,?)',
    [internshipId, 'performance', grading.final_score, JSON.stringify(grading)]
  );

  await db.run(
    'UPDATE internships SET final_score = ?, grade = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [grading.final_score, grading.grade, internshipId]
  );

  // 4. Detach Activity
  await audit.log({
    action: 'PERFORMANCE_EVALUATION',
    data: { internshipId, finalScore: grading.final_score, grade: grading.grade },
    internshipId
  });

  // 5. Jika sudah complete, publish event
  await nats.publish('PerformanceEvaluated', {
    internshipId,
    finalScore: grading.final_score,
    grade: grading.grade
  });

  return {
    workflow: 'wf_performance_evaluation',
    status: 'executed',
    data: {
      internshipId,
      finalScore: grading.final_score,
      grade: grading.grade,
      components: {
        attendance,
        reportScore: Math.round(reportScore),
        supervisorScore,
        companyScore
      },
      gradeRule
    }
  };
}

/**
 * Workflow 7: Certification & Completion
 * Menyelesaikan proses magang
 */
async function wf_certification(payload) {
  const { internshipId, userId } = payload;

  if (!internshipId) {
    return { workflow: 'wf_certification', status: 'failed', message: 'internshipId diperlukan' };
  }

  const internship = await db.get('SELECT * FROM internships WHERE id = ?', [internshipId]);
  if (!internship) {
    return { workflow: 'wf_certification', status: 'failed', message: 'Internship tidak ditemukan' };
  }

  // 1. Verifikasi nilai akhir via VRule
  const certRule = await vrule.evaluate('vrule_certificate_release', { internshipId, userId });

  if (!certRule.passed) {
    return {
      workflow: 'wf_certification',
      status: 'blocked',
      data: {
        internshipId,
        canRelease: false,
        checks: certRule.checks,
        message: 'Persyaratan sertifikat belum terpenuhi'
      }
    };
  }

  // 2. Generate sertifikat otomatis
  const certificateCode = certRule.certificateCode;

  // 3. Simpan sertifikat ke tabel certificates
  await db.run(
    'INSERT INTO certificates (internship_id, user_email, certificate_code, final_score, grade) VALUES (?,?,?,?,?)',
    [internshipId, internship.user_email, certificateCode, internship.final_score, internship.grade]
  );

  // 4. Update internship status
  await db.run(
    'UPDATE internships SET status = ?, certificate_code = ?, progress = 100, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    ['selesai', certificateCode, internshipId]
  );

  // 5. Simpan arsip magang
  await audit.log({
    action: 'CERTIFICATE_ISSUED',
    data: { internshipId, certificateCode, finalScore: internship.final_score, grade: internship.grade },
    internshipId
  });

  // 6. Publish event InternshipCompleted
  await nats.publish('InternshipCompleted', {
    internshipId,
    certificateCode,
    finalScore: internship.final_score,
    grade: internship.grade
  });

  return {
    workflow: 'wf_certification',
    status: 'executed',
    data: {
      internshipId,
      certificateCode,
      finalScore: internship.final_score,
      grade: internship.grade,
      internshipStatus: 'COMPLETED',
      message: 'Magang selesai! Sertifikat telah diterbitkan.'
    }
  };
}

// ================================================================
// WORKFLOW REGISTRY
// ================================================================

const workflows = {
  wf_registration,
  wf_eligibility,
  wf_approval,
  wf_company_placement,
  wf_progress_monitoring,
  wf_performance_evaluation,
  wf_certification
};

/**
 * Trigger a workflow by name.
 * Mencoba VFlow dulu, fallback ke implementasi Express lokal jika VFlow gagal.
 */
exports.trigger = async (name, payload) => {
  // ── Step 1: Coba VFlow ────────────────────────────────────────────────────
  if (vflow.config.fallbackLocal !== false) {
    const vflowResult = await tryVFlow(name, payload);
    if (vflowResult !== null) {
      console.log(`[WORKFLOW] ${name} handled by VFlow`);
      // Log ke workflow_logs
      try {
        await db.run(
          'INSERT INTO workflow_logs (workflow_name, status, payload) VALUES (?,?,?)',
          [name, vflowResult.status || 'executed', JSON.stringify({ payload, result: vflowResult, source: 'vflow' })]
        );
      } catch { /* log failure tidak boleh crash */ }
      return vflowResult;
    }
    // VFlow gagal atau kosong — lanjut ke fallback
    vflowLogger.fallback(name, 'VFlow unavailable or empty response');
  }

  // ── Step 2: Fallback ke implementasi lokal ────────────────────────────────
  const workflow = workflows[name];
  if (!workflow) {
    // Handle legacy workflow names
    if (name === 'wf_upload_report') {
      return wf_progress_monitoring(payload);
    }
    return { workflow: name, status: 'unknown', message: `Workflow "${name}" tidak dikenal` };
  }

  try {
    console.log(`[WORKFLOW] ${name} executing locally (fallback)...`);
    const result = await workflow(payload);

    // Log workflow execution
    await db.run(
      'INSERT INTO workflow_logs (workflow_name, status, payload) VALUES (?,?,?)',
      [name, result.status, JSON.stringify({ payload, result, source: 'express-fallback' })]
    );

    console.log(`[WORKFLOW] ${name} completed locally: ${result.status}`);
    return { ...result, source: 'express-fallback' };
  } catch (err) {
    console.error(`[WORKFLOW] ${name} local error:`, err);
    await db.run(
      'INSERT INTO workflow_logs (workflow_name, status, payload) VALUES (?,?,?)',
      [name, 'error', JSON.stringify({ payload, error: err.message })]
    );
    return { workflow: name, status: 'error', message: err.message };
  }
};

/**
 * List all available workflows
 */
exports.list = async () => {
  return Object.keys(workflows);
};

/**
 * Run full internship pipeline (all workflows)
 */
exports.runFullPipeline = async (internshipId, options = {}) => {
  const results = {};
  
  // W1: Registration check
  results.registration = await exports.trigger('wf_registration', { internshipId });

  // W2: Eligibility
  results.eligibility = await exports.trigger('wf_eligibility', { internshipId });

  // Jika tidak eligible, stop
  if (!results.eligibility.data?.eligible) {
    return { ...results, pipelineStatus: 'stopped', message: 'Tidak memenuhi syarat kelayakan' };
  }

  // W3: Approval
  results.approval = await exports.trigger('wf_approval', { internshipId });

  // W4: Company Placement
  if (options.companyId) {
    results.placement = await exports.trigger('wf_company_placement', { internshipId, companyId: options.companyId });
  } else {
    results.placement = await exports.trigger('wf_company_placement', { internshipId });
  }

  // W6: Evaluation (if final)
  if (options.evaluate) {
    results.evaluation = await exports.trigger('wf_performance_evaluation', { internshipId });
  }

  // W7: Certification (if completed)
  if (options.certify) {
    results.certification = await exports.trigger('wf_certification', { internshipId });
  }

  return { ...results, pipelineStatus: 'completed' };
};