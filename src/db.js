const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "..", "data.db"));

// Create table matching exact schema
db.exec(`
  CREATE TABLE IF NOT EXISTS ppg_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    hr REAL,
    spo2 REAL,
    hbs_percent REAL,
    vrs REAL,
    alert_level TEXT,
    env_temperature REAL,
    skin_temperature REAL,
    humidity REAL,
    altitude REAL,
    timestamp TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_device_id ON ppg_readings(device_id);
  CREATE INDEX IF NOT EXISTS idx_timestamp ON ppg_readings(timestamp);
`);

function insertReading(data) {
  const timestamp = data.timestamp || new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO ppg_readings (
      device_id, hr, spo2, hbs_percent, vrs, alert_level,
      env_temperature, skin_temperature, humidity, altitude, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    data.device_id || "unknown",
    data.hr != null ? Number(data.hr) : null,
    data.spo2 != null ? Number(data.spo2) : null,
    data.hbs_percent != null ? Number(data.hbs_percent) : null,
    data.vrs != null ? Number(data.vrs) : null,
    data.alert_level || null,
    data.env_temperature != null ? Number(data.env_temperature) : null,
    data.skin_temperature != null ? Number(data.skin_temperature) : null,
    data.humidity != null ? Number(data.humidity) : null,
    data.altitude != null ? Number(data.altitude) : null,
    timestamp
  );

  return {
    id: info.lastInsertRowid,
    device_id: data.device_id || "unknown",
    hr: data.hr != null ? Number(data.hr) : null,
    spo2: data.spo2 != null ? Number(data.spo2) : null,
    hbs_percent: data.hbs_percent != null ? Number(data.hbs_percent) : null,
    vrs: data.vrs != null ? Number(data.vrs) : null,
    alert_level: data.alert_level || null,
    env_temperature: data.env_temperature != null ? Number(data.env_temperature) : null,
    skin_temperature: data.skin_temperature != null ? Number(data.skin_temperature) : null,
    humidity: data.humidity != null ? Number(data.humidity) : null,
    altitude: data.altitude != null ? Number(data.altitude) : null,
    timestamp,
    created_at: new Date().toISOString()
  };
}

function getReadings({ limit = 50, device_id = null } = {}) {
  let query = "SELECT * FROM ppg_readings";
  const params = [];

  if (device_id) {
    query += " WHERE device_id = ?";
    params.push(device_id);
  }

  query += " ORDER BY id DESC LIMIT ?";
  params.push(limit);

  const stmt = db.prepare(query);
  return stmt.all(...params);
}

module.exports = {
  insertReading,
  getReadings
};