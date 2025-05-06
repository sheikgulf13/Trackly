
const io = require("./socketInstance");
const { getSocketId } = require("./socketRegistry");

function emitToUser(userId, event, data) {
  const socketId = getSocketId(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
}

module.exports = { emitToUser };
