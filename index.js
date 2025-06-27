const express = require("express");
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");
const socketHandler = require("./server/socket/socketHandler");
// Requiring module
// const process = require("process");

// An example displaying the respective memory
// usages in megabytes(MB)
// setInterval(() => {
//   for (const [key, value] of Object.entries(process.memoryUsage())) {
//     console.log(`Memory usage by ${key}, ${value / 1000000}MB `);
//   }
// }, 1000 * 60);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

// 👉 Serve static files from Vite build
const staticPath = path.join(__dirname, "client", "dist");
app.use(express.static(staticPath));

// 👉 Send index.html for all other non-API routes
app.get("*all", (req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socketHandler(socket);
});

server.listen(3000, () => console.log("Server running on localhost:3000"));
