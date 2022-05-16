// Including modules and libraries 
const ip = require('ip')
const path = require('path')
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)

const { debug, online, hostname, speedLimit, speedLimitBorder } = require('./config.js')
const { createBullet, createSpeedBoost, createEnemy, createPlayer, States } = require('./objects.js')
const { randint, getDistance, getCoordsByStep } = require('./functions.js')
const { performance } = require('perf_hooks')

// Variables
var playersInGame = []
// player -> {name: string, socket: socket object, x: number, y: 
// number, state: string, stateTime: number, speedLimitReachedTimes: number,
// options: { airshipTexture: string, bulletTexture: string, bulletDamage: number, health: number }}

var GameObjects = [] // object -> 
// {type: string, id: number, textureName: string, scale: number, rotate: number, x: number, y: number,
// ovement: {enable: boolean, points: [{x, y, step}...], correntPointId: number, destroyAfterGoal: bool}, 
// collision: {enable: bool, distance: number, damage: number}} 

var GameObjectCount = 0

// Ticker
const { Ticker } = require('./ticker.js')
const TickerObj = new Ticker()

// Static folder
app.use(express.static('static'))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'))
})

io.on('connection', (socket) => {
    if (debug) console.log('a user connected')

    socket.on('register', (msg) => { // name, x, y
        if (debug) console.log('a user registered to the game')
        let newPlayer = createPlayer(msg.name, socket, msg.x, msg.y)
        playersInGame.push(newPlayer)

        TickerObj.append(`player_${newPlayer.name}`, () => {
            GameObjects.push(
                createBullet(
                    x=newPlayer.x, 
                    y=newPlayer.y, 
                    id=GameObjectCount, 
                    textureName=newPlayer.options.bulletTexture, 
                    speed=newPlayer.options.bulletSpeed,
                    damage=newPlayer.options.bulletDamage
                )
            )
            GameObjectCount++
            if (newPlayer.speedLimitReachedTimes > 0) newPlayer.speedLimitReachedTimes-- 
        }, 800)
    })

    // socket.on('createObject', (obj) => { // object example
    //     obj.id = GameObjectCount
    //     GameObjectCount++
    //     GameObjects.push(obj)
    // })

    socket.on('console', (msg) => { // object example
        if (msg.data == 'godmode') {
            for (let player of playersInGame) {
                if (player.socket == socket) {
                    player.state = 'god'
                    player.stateTime = performance.now()
                    States.god.func(player)
                }
            }
        }
    })

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
                TickerObj.delete(`player_${playersInGame[playerId].name}`)
                playersInGame.splice(playerId, 1)
                return
            }
        }
        if (debug) console.log(`Unkown user has disconnected`)
    })
})

// updater loop
TickerObj.append('updaterLoop', () => {
    for (var objId in GameObjects) {
        let obj = GameObjects[objId]

        if (obj.movement.enable) {
            if (obj.type == 'object') {
                obj.x += obj.movement.speedX
                obj.y += obj.movement.speedY
            } else if (obj.movement.points.length > obj.movement.correntPointId) {
                let point = obj.movement.points[obj.movement.correntPointId]
                let coords = getCoordsByStep(obj.x, obj.y, point.x, point.y, point.step)
                obj.x = coords[0]
                obj.y = coords[1]
                if (coords[2]) {
                    obj.movement.correntPointId++
                }
                if (obj.movement.loop && obj.movement.points.length <= obj.movement.correntPointId) {
                    obj.movement.correntPointId = 0
                }
            }
        }
        
        if (obj.type == 'object' && obj.collision.enable) {
            for (let player of playersInGame)  {
                if (getDistance(player.x, player.y, obj.x, obj.y) <= obj.collision.distance) {

                    if (obj.textureName == 'speedBoost') {
                        player.state = 'boost'
                        player.stateTime = performance.now()
                        States.boost.func(player)
    
                        GameObjects.splice(objId, 1)
                        continue
                    } else if (obj.damage.canDamage) {
                        console.log(`Player ${player.name} got ${obj.damage.value} damage`)
                        GameObjects.splice(objId, 1)
                        continue
                    }
                    
                }
            }
        }


        if (obj.type == 'entity' && obj.attack.damageable) {
            for (let anotherObjId in GameObjects)  {
                let anotherObj = GameObjects[anotherObjId]
                if (anotherObj.type != 'object') continue

                if (anotherObj.damage.canDamage && 
                    (getDistance(anotherObj.x, anotherObj.y, obj.x, obj.y) <= anotherObj.collision.distance) && 
                    anotherObj.side == 'player') {
                    obj.health -= anotherObj.damage.value

                    GameObjects.splice(anotherObjId, 1)

                    if (obj.health <= 0) {
                        if (anotherObjId < objId) objId-- 
                        GameObjects.splice(objId, 1)
                    }
                    
                    continue
                }
            }
        }
    }
    let i = 0
    while (i < GameObjects.length-1) {
        let obj = GameObjects[i]
        if (obj.y > 115 && obj.y < -15 && obj.x > 115 && obj.x < -15) {
            GameObjects.splice(i, 1)
            continue
        }
        i++
    }

    io.emit('move', {players: playersInGame.map(n => ({
        name: n.name, x: n.x, y: n.y, texture: n.options.airshipTexture
    })), objects: GameObjects})
}, 10)

TickerObj.append('playerBulletsShooterAndStateChecker', () => {
    for (let player of playersInGame) {
        if (!isNaN(States[player.state].duration) && (performance.now()-player.stateTime)/1000 > States[player.state].duration) {
            States.base.func(player)
            player.state = 'base'
            player.stateTime = performance.now()
        }
    }
}, 800)

TickerObj.append('enemyBulletShooter', () => {
    for (let enemy of GameObjects) {
        if (enemy.type != 'entity') continue
        if (enemy.attack.enable) {
            let bullet = createBullet(
                x=enemy.x, 
                y=enemy.y, 
                id=GameObjectCount, 
                textureName=enemy.attack.bulletTexture, 
                speed=enemy.attack.bulletSpeed,
                damage=enemy.attack.bulletDamage
            )
            bullet.rotate = Math.PI/2
            bullet.side = 'enemy'
            bullet.collision.enable = true
            GameObjects.push(bullet)
            GameObjectCount++
        }
    }
}, 2000)

TickerObj.append('enemyCreator', () => {
    GameObjects.push(createEnemy(x=50, y=-10, id=GameObjectCount))
    GameObjectCount++
}, 5000)

TickerObj.append('boostGenerator', () => {
    GameObjects.push(createSpeedBoost(x=randint(3, 97), y=-1, id=GameObjectCount))
    GameObjectCount++
}, 20000)





const tickerTick = setInterval(() => {
    TickerObj.tick()
}, 10)

// here we go
server.listen(3000, hostname, () => {
    console.log(`listening on http://${!online ? hostname : ip.address()}:3000`)
})