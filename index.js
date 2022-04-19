// Подключение модулей
const ip = require('ip')
const path = require('path')
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Переменные 
var debug = true
var online = true
var hostname = online ? '0.0.0.0' : '127.0.0.1'
var usersInGame = {}
var objects = [] // object -> 
var objectCount = 0
// {id: number, textureName: string, scale: number, rotate: number, x: number, 
// y: number, cmd: array[string], collision: {enable: bool, distance: number}} 

// Статическая папка сервека
app.use(express.static('static'))


// Функции
function getDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2))
}

function randint(min, max) {
  max += 1
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min
}

function sendAll() {
  io.emit('move', {
    players: Object.keys(usersInGame).map((n) => {return { 'name': n, 'x': usersInGame[n].x, 'y': usersInGame[n].y}}),
    objects: objects
  })
}

// Создание тестового обьекта
function createTestObj() {
  let i = randint(11, 19)
  // let arr = []
  // let i = arr[randint(1, arr.length)-1]
  objects.push({
    id: objectCount,
    textureName: `bullet${i < 10 ? `0${i}` : i}`,
    scale: .25, 
    rotate: Math.PI/2, 
    x: randint(3, 97), 
    y: -10, 
    cmd: {
        drop: {
            speed: 0.5
        }
    }, 
    collision: {
      enable: false,
      distance: 1
    }
  })
  objectCount += 1
}

// Роутинг
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'))
});

// io роутинг
io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('register', (msg) => { // name, x, y
    console.log('a user registered to the game')
    usersInGame[msg.name] = {
      'socket': socket,
      'x': msg.x,
      'y': msg.y
    }
  })

  socket.on('createObject', (obj) => {
    obj.id = objectCount
    objectCount += 1
    objects.push(obj)
  })

  socket.on('move', (msg) => {
    for (let userName of Object.keys(usersInGame)) {
      if (usersInGame[userName]['socket'] == socket) {
        usersInGame[userName]['x'] = msg.x
        usersInGame[userName]['y'] = msg.y
      }
      sendAll()
    }
  })

  socket.on('disconnect', () => {
    for (let userName of Object.keys(usersInGame)) {
      if (usersInGame[userName]['socket'] == socket) {
        io.emit('playerDisconnected', {data: userName})
        delete usersInGame[userName]
        break
      }
    }
  })
});

setInterval(() => {

  let needToSend = false
  for (var obj of objects) {
    if (Object.keys(obj.cmd).includes('drop')) {
      obj.y += obj.cmd.drop.speed
      needToSend = true
    }

    if (obj.collision.enable) {
      for (let playerName of Object.keys(usersInGame))  {
        if (getDistance(usersInGame[playerName].x, usersInGame[playerName].y, obj.x, obj.y) <= obj.collision.distance) {
          usersInGame[playerName].socket.emit('collision', obj)
          objects = objects.filter(n => n.id != obj.id)
          break
        }
      }
    }

  }
  objects = objects.filter(n => n.y < 115 && n.y > -15 && n.x < 115 && n.x > -15 )
  if (needToSend) sendAll()
  // console.log(objects.length);
}, 10)

setInterval(() => {
  objects.push({
    id: objectCount,
    textureName: `speedBoost`,
    scale: .25, 
    rotate: 0, 
    x: randint(3, 97), 
    y: -10, 
    cmd: {
        drop: {
            speed: 0.2
        }
    }, 
    collision: {
      enable: true,
      distance: 3,
    }
  })
  objectCount += 1
}, 5000)

server.listen(3000, hostname, () => {
  console.log(`listening on http://${!online ? hostname : ip.address()}:3000`);
});