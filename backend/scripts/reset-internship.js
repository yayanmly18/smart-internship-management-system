const db = require("../integrations/database.client");

async function resetInternship() {
    const internships = await db.all("SELECT id, user_email, name, nim, status FROM internships ORDER BY id DESC");
    console.log("Current internships:", JSON.stringify(internships, null, 2));

    // Delete ALL internships (both corrupt null-name ones and test data)
    for (const i of internships) {
        console.log(`Deleting internship id=${i.id} (name=${i.name || 'NULL'})`);
        await db.run("DELETE FROM internships WHERE id=?", [i.id]);
    }

    // Clean workflow logs
    await db.run("DELETE FROM workflow_logs");

    const remaining = await db.all("SELECT id, user_email, name, nim, status FROM internships ORDER BY id DESC");
    console.log("After cleanup:", JSON.stringify(remaining, null, 2));
    process.exit(0);
}

resetInternship().catch(e => { console.error(e); process.exit(1); });