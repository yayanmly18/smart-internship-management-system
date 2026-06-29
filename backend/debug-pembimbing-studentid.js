const db = require('./integrations/database.client');

async function main() {
  // 1) Ambil 1 pembimbing
  const pembimbing = await db.get(
    "SELECT id, name, nip, email FROM users WHERE role = 'pembimbing' ORDER BY id DESC LIMIT 1"
  );
  if (!pembimbing) {
    console.log('Tidak ada user dengan role=pembimbing');
    process.exit(0);
  }

  console.log('Pembimbing terpilih:', pembimbing);

  // 2) Ambil internships milik pembimbing itu
  const internships = await db.all(
    "SELECT id, user_email, pembimbing_email, status, progress, created_at FROM internships WHERE LOWER(pembimbing_email)=LOWER(?) ORDER BY created_at DESC LIMIT 3",
    [pembimbing.email]
  );

  console.log('\nInternships milik pembimbing (top 3):');
  console.table(internships.map(i => ({
    internshipId: i.id,
    userEmail: i.user_email,
    status: i.status,
    progress: i.progress,
    createdAt: i.created_at,
  })));

  if (!internships || internships.length === 0) {
    console.log('Tidak ada internships untuk pembimbing ini');
    process.exit(0);
  }

  // 3) Ambil 1-2 report untuk internship pertama
  const internshipId = internships[0].id;
  const reports = await db.all(
    "SELECT id, week, note, file_path, created_at FROM reports WHERE internship_id = ? ORDER BY week ASC LIMIT 3",
    [internshipId]
  );

  console.log(`\nReports untuk internship ${internshipId} (top 3):`);
  console.table(reports.map(r => ({
    reportId: r.id,
    week: r.week,
    uploadedAt: r.created_at,
  })));

  // 4) Ambil feedbacks yang terkait internship itu (untuk melihat student_id & format comment)
  //    Kita ambil semua feedback untuk internshipId itu, lalu tampilkan contoh.
  const feedbacks = await db.all(
    "SELECT id, student_id, internship_id, score, comment, created_at FROM feedbacks WHERE internship_id = ? ORDER BY created_at DESC LIMIT 10",
    [internshipId]
  );

  console.log(`\nFeedbacks untuk internship ${internshipId} (top 10):`);
  console.log(feedbacks.map(f => ({
    feedbackId: f.id,
    student_id: f.student_id,
    score: f.score,
    comment: f.comment,
    created_at: f.created_at,
  })));

  // 5) Ambil contoh student mapping (NIM/email)
  const studentRow = await db.get(
    "SELECT email, nim, name FROM users WHERE LOWER(email)=LOWER(?) LIMIT 1",
    [internships[0].user_email]
  );
  console.log('\nMapping mahasiswa user_email -> users:', studentRow);

  // 6) Statistik cepat: feedback student_id itu kebanyakan nim atau email?
  const idValues = feedbacks.map(f => String(f.student_id || ''));
  const looksLikeEmail = idValues.filter(v => v.includes('@')).length;
  const looksLikeNim = idValues.filter(v => /^\d{6,}$/.test(v)).length; // heuristik
  console.log('\nHeuristik isi feedback.student_id:');
  console.log({
    totalFeedbackSample: idValues.length,
    countHasAt: looksLikeEmail,
    countLooksLikeNim: looksLikeNim,
    sampleStudentIds: idValues.slice(0, 5),
  });

  // 7) Deteksi week format di comment
  const weekMatches = feedbacks.map(f => {
    const m = String(f.comment || '').match(/\(Minggu (\d+)\)/);
    return m ? Number(m[1]) : null;
  });
  console.log('\nDeteksi parsing week dari comment (null = tidak match):');
  console.log(weekMatches);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

