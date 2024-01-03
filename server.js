const http = require("http");
const fs = require("fs");
const socketIO = require("socket.io");

// Tạo server HTTP
const server = http.createServer((req, res) => {
  fs.readFile(__dirname + "/index.html", "utf-8", (error, content) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(content);
  });
});

const io = socketIO(server);
const socketRoomMap = {}; // Lưu trữ id người dùng và room đã join

// Sự kiện khi một client kết nối
io.on("connection", (socket) => {
  console.log("Người dùng Id: ", socket.id, " đã kết nối");

  // Sự kiện khi một client ngắt kết nối
  socket.on("disconnect", () => {
    if (socketRoomMap[socket.id]) {
      const disconnectedUser = socket.id;
      const disconnectedRoom = socketRoomMap[socket.id];
      delete disconnectedRoom;
      console.log(
        "Người dùng ID: " +
          disconnectedUser +
          " đã rời khỏi phòng " +
          disconnectedRoom
      );
      // const numofclients = io.sockets.adapter.rooms.get(disconnectedRoom).size;
      // console.log("clients left: ", numofclients);
    } else {
      delete socket.id;
      console.log("Người dùng Id: ", socket.id, " đã ngắt kết nối");
    }
  });

  socket.on("USER_SEND_NEW_MESSAGE", (data) => {
    io.to(data.roomId).emit("SUPPORTER_HAVE_NEW_MESSAGE");
  });

  socket.on("SUPPORTER_SEND_NEW_MESSAGE", (data) => {
    io.to(data.roomId).emit("USER_HAVE_NEW_MESSAGE");
  });

  socket.on("JOIN_ROOM", (data) => {
    socket.join(data.roomId);
    socketRoomMap[socket.id] = data.roomId;
    switch (data.connection) {
      case "user":
        console.log(`UserId ${socket.id} joined room ${data.roomId}`);
        break;
      case "supporter":
        io.to(data.roomId).emit("SUPPORTER_JOINED");
        break;
    }
  });

  socket.on("LEAVE_ROOM", (data) => {
    socket.leave(data.roomId);
    delete socketRoomMap[socket.id];
    switch (data.connection) {
      case "user":
        console.log(`UserId ${socket.id} leave room ${data.roomId}`);
        break;
      case "supporter":
        console.log(`Supporter ${socket.id} leave room ${data.roomId}`);
        break;
    }
  });
});

// Lắng nghe cổng 3000
const HOST = "192.168.101.102";
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
