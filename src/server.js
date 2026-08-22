const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const path = require("path");
const { insertReading, getReadings } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on("connection", (ws) => {
  console.log("[WebSocket] Client connected");
  ws.send(JSON.stringify({
    type: "CONNECTION_ESTABLISHED",
    message: "Connected to PolyPPG live updates stream"
  }));
  ws.on("close", () => console.log("[WebSocket] Client disconnected"));
});

// GET /api/data or /api/readings with optional ?limit=50&device_id=polyppg-001
app.get(["/api/data", "/api/readings"], (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const device_id = req.query.device_id || null;
    const records = getReadings({ limit, device_id });
    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/data or /api/readings
app.post(["/api/data", "/api/readings"], (req, res) => {
  try {
    const payload = req.body;
    if (!payload || Object.keys(payload).length === 0) {
      return res.status(400).json({ success: false, error: "Request body cannot be empty" });
    }

    // Support either single object or array of readings
    const isArray = Array.isArray(payload);
    const items = isArray ? payload : [payload];
    const savedRecords = items.map(item => insertReading(item));

    // Broadcast each new reading (or batch) to connected clients
    savedRecords.forEach(record => {
      broadcast({
        type: "NEW_READING",
        data: record
      });
    });

    res.status(201).json({
      success: true,
      message: "Reading(s) saved and broadcasted successfully",
      data: isArray ? savedRecords : savedRecords[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`WebSocket server listening on ws://localhost:${PORT}`);
});