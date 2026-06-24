const db = require("../integrations/database.client");

async function migrate() {
  try {
    await db.run("ALTER TABLE reports ADD COLUMN file_path TEXT");
    console.log("Column file_path added successfully");
  } catch (err) {
    if (err.message.includes("duplicate column")) {
      console.log("Column file_path already exists");
    } else {
      console.log("Error:", err.message);
    }
  }
  process.exit(0);
}

migrate();