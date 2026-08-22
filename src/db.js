const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "..", "data.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payload TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

function insertRecord(payload) {
  const stmt = db.prepare("INSERT INTO records (payload) VALUES (?)");
  const info = stmt.run(JSON.stringify(payload));
  return {
    id: info.lastInsertRowid,
    payload,
    created_at: new Date().toISOString()
  };
}

function getAllRecords(limit = 100) {
  const stmt = db.prepare("SELECT * FROM records ORDER BY id DESC LIMIT ?");
  const rows = stmt.all(limit);
  return rows.map(r => ({
    id: r.id,
    payload: JSON.parse(r.payload),
    created_at: r.created_at
  }));
}

module.exports = { insertRecord, getAllRecords };