// Including modules and libraries 
const ip = require('ip')
const path = require('path')
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)

const { 
    debug, online, hostname, createBullet, 
    createSpeedBoost, createEnemy, createPlayer, 
    States, speedLimit, speedLimitBorder } = require('./config.js')
const { randint, getDistance } = require('./functions.js')
const { performance } = require('perf_hooks')

// Variables
var playersInGame = []
// player -> {name: string, socket: socket object, x: number, y: 
// number, state: string, stateTime: number, speedLimitReachedTimes: number,
// options: { airshipTexture: string, bulletTexture: string, bulletDamage: number, health: number }}

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
        playersInGame.push(createPlayer(msg.name, socket, msg.x, msg.y))
    })

    // socket.on('createObject', (obj) => { // object example
    //     obj.id = GameObjectCount
    //     GameObjectCount++
    //     GameObjects.push(obj)
    // })

    socket.on('move', (msg) => { // x, y
        for (let player of playersInGame) {
            if (player['socket'] == socket) {

                if (getDistance(player.x, player.y, msg.x, msg.y) > speedLimit) { // fast move detecter
                    player.speedLimitReachedTimes++
                    if (player.speedLimitReachedTimes >= speedLimitBorder) {
                        player.speedLimitReachedTimes = 0
                        socket.emit('fastMove', {data: Math.round(getDistance(player.x, player.y, msg.x, msg.y))})
                    }
                }

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
                    
                    player.state = 'boost'
                    player.stateTime = performance.now()
                    States.boost.func(player)

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
                    obj.health -= anotherObj.collision.damage
                    
                    if (obj.health <= 0) {
                        GameObjects.splice(objId, 1)
                    }
                    return
                }
            }
        }
    }
    GameObjects = GameObjects.filter(n => n.y < 115 && n.y > -15 && n.x < 115 && n.x > -15 )
    io.emit('move', {players: playersInGame.map(n => ({
        name: n.name, x: n.x, y: n.y, texture: n.options.airshipTexture
    })), objects: GameObjects})
}, 10)

var bulletsShooterAndStateChecker = setInterval(() => {
    for (let player of playersInGame) {
        if (!isNaN(States[player.state].duration) && (performance.now()-player.stateTime)/1000 > States[player.state].duration) {
            States.base.func(player)
            player.state = 'base'
            player.stateTime = performance.now()
        }
        GameObjects.push(
            createBullet(
                x=player.x, 
                y=player.y, 
                id=GameObjectCount, 
                textureName=player.options.bulletTexture, 
                speed=player.options.bulletSpeed,
                damage=player.options.bulletDamage
            )
        )
        GameObjectCount++
        if (player.speedLimitReachedTimes > 0) player.speedLimitReachedTimes-- 
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