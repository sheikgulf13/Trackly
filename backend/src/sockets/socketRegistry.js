const onlineUsers = new Map();

function registerUser(userId, socketId) {
  onlineUsers.set(userId, socketId);
}
function deregisterSocket(socketId) {
  for (const [userId, sid] of onlineUsers.entries()) {
    if (sid === socketId) {
      onlineUsers.delete(userId);
      break;
    }
  }
}

function getSocketId(userId) {
  return onlineUsers.get(userId);
}

module.exports = {
  registerUser,
  deregisterSocket,
  getSocketId,
};
