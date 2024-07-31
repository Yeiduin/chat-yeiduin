const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const url = `mongodb+srv://${process.env.USUARIO}:${process.env.PASSWORD}@cluster0.2upce1p.mongodb.net/${process.env.DBNAME}?retryWrites=true&w=majority&appName=Cluster0`;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: url,
    methods: ["GET", "POST"],
  },
});

const User = require("./models/User");
const Message = require("./models/Message");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("base de datos conectada"))
  .catch((error) => console.log(error));

const connectedUsers = new Set();

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("join", async ({ username, icon }) => {
    const user = new User({ username, icon, socketId: socket.id });
    await user.save();
    connectedUsers.add(user);
    io.emit("userList", Array.from(connectedUsers));

    const messages = await Message.find().sort({ createdAt: -1 }).limit(100);
    socket.emit("loadMessages", messages.reverse());
  });

  socket.on("sendMessage", async (message) => {
    const user = await User.findOne({ socketId: socket.id });
    if (user) {
      const newMessage = new Message({
        username: user.username,
        icon: user.icon,
        text: message,
      });
      await newMessage.save();
      io.emit("message", newMessage);

      const count = await Message.countDocuments();
      if (count > 100) {
        const oldestMessage = await Message.findOne().sort({ createdAt: 1 });
        await Message.findByIdAndDelete(oldestMessage._id);
      }
    }
  });

  socket.on("disconnect", async () => {
    console.log("Client disconnected");
    const disconnectedUser = Array.from(connectedUsers).find(
      (user) => user.socketId === socket.id
    );
    if (disconnectedUser) {
      connectedUsers.delete(disconnectedUser);
      io.emit("userList", Array.from(connectedUsers));
    }
  });
  /* socket.on("disconnect", async () => {
    console.log("Client disconnected");
    const user = await User.findOneAndDelete({ socketId: socket.id });
    console.log(user);
    if (user) {
      connectedUsers.delete(user);
      console.log(connectedUsers);
      io.emit("userList", Array.from(connectedUsers));
    }
  });

*/
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
