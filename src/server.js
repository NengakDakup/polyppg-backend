const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const path = require("path");
const { insertRecord, getAllRecords } = require("./db");

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
    message: "Connected to live updates stream"
  }));
  ws.on("close", () => console.log("[WebSocket] Client disconnected"));
});

app.get("/api/data", (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const records = getAllRecords(limit);
    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/data", (req, res) => {
  try {
    const payload = req.body;
    if (!payload || Object.keys(payload).length === 0) {
      return res.status(400).json({ success: false, error: "Request body cannot be empty" });
    }
    const savedRecord = insertRecord(payload);
    broadcast({
      type: "NEW_DATA",
      data: savedRecord
    });
    res.status(201).json({
      success: true,
      message: "Data saved and broadcasted successfully",
      data: savedRecord
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`WebSocket server is listening on ws://localhost:${PORT}`);
});