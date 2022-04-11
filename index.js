// Подключение модулей
const ip = require('ip')
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

// Основные обьекты
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Переменные 
var debug = true
var online = true
var hostname = online ? '0.0.0.0' : '127.0.0.1'

// Статическая папка сервека
app.use(express.static('static'))

// Роутинг
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
  // res.send('<h1>Hello from backend!</h1>');
});

// 
io.on('connection', (socket) => {
  console.log('a user connected');
});

server.listen(3000, hostname, () => {
  console.log(`listening on http://${!online ? hostname : ip.address()}:3000`);
});