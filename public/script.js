const socket = io("https://chat-yeiduin.vercel.app/");

const loginScreen = document.getElementById("login-screen");
const chatScreen = document.getElementById("chat-screen");
const usernameInput = document.getElementById("username-input");
const iconSelect = document.getElementById("icon-select");
const joinBtn = document.getElementById("join-btn");
const messageContainer = document.getElementById("message-container");
const userList = document.getElementById("user-list");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");

joinBtn.addEventListener("click", () => {
  const username = usernameInput.value.trim();
  const icon = iconSelect.value;
  if (username) {
    socket.emit("join", { username, icon });
    loginScreen.style.display = "none";
    chatScreen.style.display = "block";
  }
});

socket.on("userList", (users) => {
  userList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = `${user.icon} ${user.username}`;
    userList.appendChild(li);
  });
});

socket.on("loadMessages", (messages) => {
  messageContainer.innerHTML = "";
  messages.forEach(addMessageToDOM);
});

socket.on("message", addMessageToDOM);

sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (message) {
    socket.emit("sendMessage", message);
    messageInput.value = "";
  }
}

function addMessageToDOM(message) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  messageElement.innerHTML = `
        <span class="icon">${message.icon}</span>
        <span class="username">${message.username}:</span>
        <span class="text">${message.text}</span>
    `;
  messageContainer.appendChild(messageElement);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}
