const fs = require("fs");
const path = require("path");

const SESSION_FILE = path.join(__dirname, "../data/sessions.json");

// Safely parse file
function readSessionsFile() {
  try {
    if (!fs.existsSync(SESSION_FILE)) return {};
    const content = fs.readFileSync(SESSION_FILE, "utf-8");
    if (!content.trim()) return {}; // file exists but empty
    return JSON.parse(content);
  } catch (err) {
    console.error("⚠️ Failed to parse sessions.json:", err.message);
    return {};
  }
}

function saveSession(clientId, state, sessionName) {
  const sessions = readSessionsFile();

  const timestamp = Date.now();
  const sessionKey = `${clientId}_${timestamp}`; // 👈 Unique key per session

  sessions[sessionKey] = {
    ...state,
    clientId,
    savedAt: new Date().toISOString(),
    name: sessionName || `Session @ ${new Date().toLocaleTimeString()}`,
  };

  fs.writeFileSync(SESSION_FILE, JSON.stringify(sessions, null, 2));
}

function getAllSessions() {
  return readSessionsFile();
}

function deleteSession(sessionKey) {
  const sessions = readSessionsFile();

  if (sessions[sessionKey]) {
    delete sessions[sessionKey];
    fs.writeFileSync(SESSION_FILE, JSON.stringify(sessions, null, 2));
    return true;
  }

  return false;
}

module.exports = {
  saveSession,
  getAllSessions,
  deleteSession,
};
