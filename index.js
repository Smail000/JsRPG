// Including modules and libraries 
const ip = require('ip')
const path = require('path')
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)

const { debug, online, hostname, createBullet, createSpeedBoost, createEnemy } = require('./config.js')
const { randint, getDistance } = require('./functions.js')

// Variables
var playersInGame = []
// player -> {name: string, socket: socket object, x: number, y: number, loop: loopObject, bulletSize}

var GameObjects = [] // object -> 
// {id: number, textureName: string, scale: number, rotate: number, x: number, y: number, 
// drop: {enable: boolean, speedX: number, speedY: number}, 
// collision: {enable: bool, distance: number, damage: number}} 

var GameObjectCount = 0

// Static folder
app.use(express.static('static'))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'))
})

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

    socket.on('createObject', (obj) => { // object example
        obj.id = GameObjectCount
        GameObjectCount++
        GameObjects.push(obj)
    })

    socket.on('move', (msg) => { // x, y
        for (let player of playersInGame) {
            if (player['socket'] == socket) {

                // if (getDistance(player.x, player.y, msg.x, msg.y) > 1) console.log('cheat') // anti fast move detecter
                // console.log(getDistance(player.x, player.y, msg.x, msg.y))

                player.x = msg.x
                player.y = msg.y

                return
            }
        }
    })

    socket.on('disconnect', () => { // nothing
        for (let playerId in playersInGame) {
            if (playersInGame[playerId]['socket'] == socket) {
                io.emit('playerDisconnected', {data: playersInGame[playerId].name})
                if (debug) console.log(`Player with name ${playersInGame[playerId].name} has disconnected`)
                playersInGame.splice(playerId, 1)
                return
            }
        }
        if (debug) console.log(`Unkown user has disconnected`)
    })
})

// tick updater loop
setInterval(() => {
    for (var objId in GameObjects) {
        let obj = GameObjects[objId]

        if (obj.drop.enable) {
            obj.x += obj.drop.speedX
            obj.y += obj.drop.speedY
        }
        
        if (obj.collision.enable) {
            for (let player of playersInGame)  {
                if (getDistance(player.x, player.y, obj.x, obj.y) <= obj.collision.distance) {
                    GameObjects.push(createBullet(x=player.x, y=player.y, id=GameObjectCount, textureName='bullet21'))
                    GameObjectCount++
                    GameObjects.splice(objId, 1)
                    return
                }
            }
        }


        if (obj.collision.damageable) {
            for (let anotherObjId in GameObjects)  {
                let anotherObj = GameObjects[anotherObjId]
                if (anotherObj.collision.canDamage && (getDistance(anotherObj.x, anotherObj.y, obj.x, obj.y) <= anotherObj.collision.distance)) {
                    GameObjects.splice(anotherObjId, 1)
                    console.log('got damage(')
                    return
                }
            }
        }
    }
    GameObjects = GameObjects.filter(n => n.y < 115 && n.y > -15 && n.x < 115 && n.x > -15 )
    io.emit('move', {players: playersInGame.map(n => ({name: n.name, x: n.x, y: n.y})), objects: GameObjects})
}, 10)

var bulletsShooter = setInterval(() => {
    for (let player of playersInGame) {
        GameObjects.push(createBullet(x=player.x, y=player.y, id=GameObjectCount, textureName='bullet01'))
        GameObjectCount++
    }
}, 800)

var boostGenerator = setInterval(() => {
    GameObjects.push(createSpeedBoost(x=randint(3, 97), y=-1, id=GameObjectCount))
    GameObjectCount++
}, 20000)

setTimeout(() => {
    GameObjects.push(createEnemy(x=50, y=5, id=GameObjectCount))
    GameObjectCount++
}, 5000)

// here we go
server.listen(3000, hostname, () => {
    console.log(`listening on http://${!online ? hostname : ip.address()}:3000`)
})