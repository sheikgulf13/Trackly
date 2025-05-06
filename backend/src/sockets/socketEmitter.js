
const { getIO } = require("./socketInstance");
const { getSocketId } = require("./socketRegistry");

function emitToUser(userId, event, data) {
  const socketId = getSocketId(userId);
  if (socketId) {
    getIO.to(socketId).emit(event, data);
  }
}

module.exports = { emitToUser };
