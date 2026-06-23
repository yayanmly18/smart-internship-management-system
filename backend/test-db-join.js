const db = require("./integrations/database.client");

async function test() {
    console.log("=== 1. SEMUA USERS (mahasiswa) ===");
    const users = await db.all("SELECT id, name, nim, email, role FROM users WHERE role='mahasiswa'");
    console.log(JSON.stringify(users, null, 2));

    console.log("\n=== 2. SEMUA INTERNSHIPS ===");
    const internships = await db.all("SELECT * FROM internships");
    console.log(JSON.stringify(internships, null, 2));

    console.log("\n=== 3. JOIN QUERY (admin applicants) ===");
    const joined = await db.all(`
        SELECT u.id as userId, u.name, u.nim, u.email, u.prodi, u.year,
               i.status, i.progress, i.company, i.pembimbing_email, i.id as internshipId
        FROM users u LEFT JOIN internships i ON i.user_email = u.email
        WHERE u.role = 'mahasiswa'
        ORDER BY i.created_at DESC, u.id DESC
    `);
    console.log(JSON.stringify(joined, null, 2));

    console.log("\n=== 4. WORKFLOW LOGS (last 5) ===");
    const logs = await db.all("SELECT * FROM workflow_logs ORDER BY id DESC LIMIT 5");
    console.log(JSON.stringify(logs, null, 2));

    process.exit(0);
}

test().catch(e => { console.error(e); process.exit(1); });