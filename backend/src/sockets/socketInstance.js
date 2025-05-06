const { Server } = require("socket.io");
const { registerUser, deregisterSocket } = require("./socketRegistry");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Authorization"]
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) registerUser(userId, socket.id);

    socket.on("disconnect", () => {
      deregisterSocket(socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket(server) first.");
  }
  return io;
}

module.exports = {
  initSocket,
  getIO,
};
