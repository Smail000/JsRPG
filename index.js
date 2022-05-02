// Подключение модулей
const ip = require('ip')
const path = require('path')
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)

const { debug, online, hostname } = require('./config.js')
const { randint, getDistance } = require('./functions.js')

// Переменные 
var playersInGame = []
var GameObjects = [] // object -> 
// {id: number, textureName: string, scale: number, rotate: number, x: number, 
// y: number, cmd: array[string], collision: {enable: bool, distance: number}} 
var GameObjectCount = 0

// Статическая папка сервека
app.use(express.static('static'))

// Создание тестового обьекта
function createTestObj() {
  let i = randint(11, 19)
  // let arr = []
  // let i = arr[randint(1, arr.length)-1]
  GameObjects.push({
    id: GameObjectCount,
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
  GameObjectCount += 1
}

// Роутинг
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'))
})

// io роутинг
io.on('connection', (socket) => {
  if (debug) console.log('a user connected')

  socket.on('register', (msg) => { // name, x, y
    if (debug) console.log('a user registered to the game')
    playersInGame.push({
      name: msg.name,
      socket: socket,
      x: msg.x,
      y: msg.y
    })
  })

  socket.on('createObject', (obj) => {
    obj.id = GameObjectCount
    GameObjectCount += 1
    GameObjects.push(obj)
  })

  socket.on('move', (msg) => {
    for (let player of playersInGame) {
      if (player['socket'] == socket) {
        player['x'] = msg.x
        player['y'] = msg.y
      }
      io.emit('move', {
        players: playersInGame.map(n => ({name: n.name, x: n.x, y: n.y})), // отправить без объекта сокета
        objects: GameObjects
      })
    }
  })

  socket.on('disconnect', () => {
    for (let playerId in playersInGame) {
      if (playersInGame[playerId]['socket'] == socket) {
        io.emit('playerDisconnected', {data: playersInGame[playerId].name})
        playersInGame.pop(playerId)
        break
      }
    }
  })
})

setInterval(() => {

  let requireToSend = false
  for (var obj of GameObjects) {
    if (Object.keys(obj.cmd).includes('drop')) {
      obj.y += obj.cmd.drop.speed
      requireToSend = true
    }

    if (obj.collision.enable) {
      for (let player of playersInGame)  {
        if (getDistance(player.x, player.y, obj.x, obj.y) <= obj.collision.distance) {
          player.socket.emit('collision', obj)
          GameObjects = GameObjects.filter(n => n.id != obj.id)
          break
        }
      }
    }
  }
  GameObjects = GameObjects.filter(n => n.y < 115 && n.y > -15 && n.x < 115 && n.x > -15 )
  if (requireToSend) io.emit('move', {players: playersInGame.map(n => ({name: n.name, x: n.x, y: n.y})), objects: GameObjects})
}, 10)

setInterval(() => {
  GameObjects.push({
    id: GameObjectCount,
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
      distance: 1.5,
    }
  })
  GameObjectCount += 1
}, 5000)

server.listen(3000, hostname, () => {
  console.log(`listening on http://${!online ? hostname : ip.address()}:3000`)
})