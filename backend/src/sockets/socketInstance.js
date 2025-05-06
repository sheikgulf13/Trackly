
const { Server } = require("socket.io");
const { registerUser, deregisterSocket } = require("./socketRegistry");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"],
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

module.exports = io;
module.exports = initSocket;
