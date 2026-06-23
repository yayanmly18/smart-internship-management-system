const db = require("../integrations/database.client");

// ================================================================
// VRULE ENGINE - Rule evaluation service
// ================================================================

const rules = {
  /**
   * vrule_eligibility_check - Menentukan kelayakan peserta
   * Rules: IPK >= 2.5, semester >= 3, role = mahasiswa
   */
  vrule_eligibility_check: async (data) => {
    const { userId, gpa, semester } = data;
    let passed = true;
    const checks = [];

    if (gpa !== undefined) {
      if (gpa >= 3.5) {
        checks.push({ check: 'IPK >= 3.5', status: 'passed', score: 40 });
      } else if (gpa >= 3.0) {
        checks.push({ check: 'IPK >= 3.0', status: 'passed', score: 25 });
      } else if (gpa >= 2.5) {
        checks.push({ check: 'IPK >= 2.5', status: 'passed', score: 10 });
      } else {
        checks.push({ check: 'IPK >= 2.5', status: 'failed', score: 0 });
        passed = false;
      }
    }

    if (semester !== undefined) {
      if (semester >= 5) {
        checks.push({ check: 'Semester >= 5', status: 'passed', score: 20 });
      } else if (semester >= 3) {
        checks.push({ check: 'Semester >= 3', status: 'passed', score: 10 });
      } else {
        checks.push({ check: 'Semester >= 3', status: 'failed', score: 0 });
        passed = false;
      }
    }

    return { rule: 'vrule_eligibility_check', passed, checks, data };
  },

  /**
   * vrule_approval_requirement - Menentukan kebutuhan approval
   * Rules: Mahasiswa harus punya pembimbing yang ditunjuk
   */
  vrule_approval_requirement: async (data) => {
    const { internshipId } = data;
    
    // Check if internship has pembimbing assigned
    const internship = await db.get(
      'SELECT id, pembimbing_email FROM internships WHERE id = ?',
      [internshipId]
    );

    const hasPembimbing = !!internship?.pembimbing_email;
    
    // Check if pembimbing is active
    let pembimbingActive = false;
    if (hasPembimbing) {
      const pembimbing = await db.get(
        'SELECT id FROM users WHERE email = ? AND role = ?',
        [internship.pembimbing_email, 'pembimbing']
      );
      pembimbingActive = !!pembimbing;
    }

    const requiresApproval = true;
    const canProceed = hasPembimbing && pembimbingActive;

    return {
      rule: 'vrule_approval_requirement',
      passed: canProceed,
      requiresApproval,
      checks: [
        { check: 'Pembimbing ditunjuk', status: hasPembimbing ? 'passed' : 'failed' },
        { check: 'Pembimbing aktif', status: pembimbingActive ? 'passed' : 'failed' },
      ],
      data
    };
  },

  /**
   * vrule_company_matching - Menentukan perusahaan terbaik
   * Rules: Cocokkan skill mahasiswa dengan bidang perusahaan
   */
  vrule_company_matching: async (data) => {
    const { studentSkills, companyBidang } = data;
    
    const skillMapping = {
      'React.js': 'Frontend Development',
      'Node.js': 'Backend Engineering',
      'Python': 'Data Science & Analytics',
      'Java': 'Backend Engineering',
      'JavaScript': 'Frontend Development',
      'TypeScript': 'Frontend Development',
      'Angular': 'Frontend Development',
      'Vue.js': 'Frontend Development',
      'Django': 'Backend Engineering',
      'Flask': 'Backend Engineering',
      'TensorFlow': 'Data Science & Analytics',
      'Machine Learning': 'Data Science & Analytics',
      'DevOps': 'DevOps & Cloud',
      'Docker': 'DevOps & Cloud',
      'Kubernetes': 'DevOps & Cloud',
      'React Native': 'Mobile Development',
      'Flutter': 'Mobile Development',
      'Kotlin': 'Mobile Development',
      'Swift': 'Mobile Development',
    };

    const skills = Array.isArray(studentSkills) ? studentSkills : [];
    const matchCount = skills.filter(s => {
      const mapped = skillMapping[s] || '';
      return mapped.toLowerCase() === (companyBidang || '').toLowerCase() ||
             s.toLowerCase().includes((companyBidang || '').toLowerCase().slice(0, 5));
    }).length;

    const matchScore = skills.length > 0 ? Math.round((matchCount / Math.max(skills.length, 1)) * 100) : 0;

    return {
      rule: 'vrule_company_matching',
      passed: matchScore >= 30,
      matchScore,
      checks: [
        { check: 'Skill match', status: matchScore >= 50 ? 'excellent' : matchScore >= 30 ? 'sufficient' : 'insufficient', score: matchScore },
      ],
      data
    };
  },

  /**
   * vrule_progress_compliance - Memeriksa kepatuhan laporan mingguan
   * Rules: Minimal 6 dari 8 laporan harus dikirim
   */
  vrule_progress_compliance: async (data) => {
    const { internshipId } = data;
    
    const reportCount = internshipId ? await db.get(
      'SELECT COUNT(*) as count FROM reports WHERE internship_id = ?',
      [internshipId]
    ) : { count: 0 };

    const total = reportCount?.count || 0;
    const required = 6;
    const maxWeeks = 8;
    const compliance = Math.round((total / maxWeeks) * 100);

    return {
      rule: 'vrule_progress_compliance',
      passed: total >= required,
      compliance,
      checks: [
        { check: `Laporan dikirim ${total}/${maxWeeks}`, status: total >= required ? 'passed' : 'insufficient' },
        { check: `Compliance rate ${compliance}%`, status: compliance >= 75 ? 'passed' : 'warning' },
      ],
      data: { ...data, totalReports: total, required, maxWeeks }
    };
  },

  /**
   * vrule_performance_grading - Menentukan grade akhir
   * Rules: A >= 85, B >= 75, C >= 60, D >= 50, E < 50
   */
  vrule_performance_grading: async (data) => {
    const { finalScore } = data;
    const score = finalScore || 0;

    let grade = 'E';
    let passed = false;
    let predikat = 'Tidak Lulus';

    if (score >= 85) { grade = 'A'; passed = true; predikat = 'Sangat Memuaskan'; }
    else if (score >= 75) { grade = 'B'; passed = true; predikat = 'Memuaskan'; }
    else if (score >= 60) { grade = 'C'; passed = true; predikat = 'Cukup'; }
    else if (score >= 50) { grade = 'D'; passed = false; predikat = 'Kurang'; }
    else { grade = 'E'; passed = false; predikat = 'Tidak Lulus'; }

    return {
      rule: 'vrule_performance_grading',
      passed,
      grade,
      predikat,
      checks: [
        { check: `Nilai ${score}`, status: passed ? 'passed' : 'failed' },
        { check: `Grade ${grade}`, status: passed ? 'passed' : 'failed' },
      ],
      data
    };
  },

  /**
   * vrule_certificate_release - Menentukan apakah sertifikat dapat diterbitkan
   * Rules: Semua persyaratan harus terpenuhi
   */
  vrule_certificate_release: async (data) => {
    const { internshipId, userId } = data;

    const user = userId ? await db.get('SELECT name, nim FROM users WHERE id = ?', [userId]) : null;
    const internship = internshipId ? await db.get(
      'SELECT id, status, progress, company FROM internships WHERE id = ?',
      [internshipId]
    ) : null;

    const reportCount = internshipId ? await db.get(
      'SELECT COUNT(*) as count FROM reports WHERE internship_id = ?',
      [internshipId]
    ) : { count: 0 };

    const feedbackCount = internshipId ? await db.get(
      'SELECT COUNT(*) as count FROM feedbacks WHERE student_id = ?',
      [user?.nim || '']
    ) : { count: 0 };

    const checks = [
      { check: 'Status magang selesai', status: internship?.status === 'selesai' ? 'passed' : 'failed' },
      { check: 'Progress 100%', status: (internship?.progress || 0) >= 100 ? 'passed' : 'failed' },
      { check: 'Laporan lengkap', status: (reportCount?.count || 0) >= 6 ? 'passed' : 'failed' },
      { check: 'Feedback pembimbing', status: (feedbackCount?.count || 0) >= 1 ? 'passed' : 'failed' },
    ];

    const allPassed = checks.every(c => c.status === 'passed');

    return {
      rule: 'vrule_certificate_release',
      passed: allPassed,
      checks,
      certificateCode: allPassed ? `CERT-UTI-2026-${user?.nim || '00000'}` : null,
      data
    };
  },
};

/**
 * Evaluate a VRule by name
 */
exports.evaluate = async (ruleName, data) => {
  const rule = rules[ruleName];
  if (!rule) {
    return { rule: ruleName, passed: false, error: `Rule ${ruleName} not found` };
  }
  
  try {
    const result = await rule(data);
    // Log the evaluation to DB
    await db.run(
      'INSERT INTO workflow_logs (workflow_name, status, payload) VALUES (?,?,?)',
      [ruleName, result.passed ? 'passed' : 'failed', JSON.stringify({ data, result })]
    );
    return result;
  } catch (err) {
    console.error(`VRule ${ruleName} error:`, err);
    return { rule: ruleName, passed: false, error: err.message };
  }
};

/**
 * List all available VRules
 */
exports.listRules = () => Object.keys(rules);