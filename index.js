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
TickerObj.speedRate = 1

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
                    player.currenthealth = 9999
                    player.stateTime = performance.now()
                    States.god.func(player)
                }
            }
        } else if (msg.data == 'setSpeedRate') {
            TickerObj.speedRate = msg.speedRate
        }
    })

    socket.on('move', (msg) => { // x, y
        for (let player of playersInGame) {
            if (player['socket'] == socket) {

                if (getDistance(player.x, player.y, msg.x, msg.y) > speedLimit) { // fast move detecter
                    player.speedLimitReachedTimes++
                    if (player.speedLimitReachedTimes >= speedLimitBorder) {
                        player.speedLimitReachedTimes = 0
                        socket.emit('fastMove', {data: getDistance(player.x, player.y, msg.x, msg.y)})
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
    let skip = false

    let objId = 0
    while (objId < GameObjects.length) {
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
            let playerId = 0
            while (playerId < playersInGame.length)  {
                let player = playersInGame[playerId]
                if (getDistance(player.x, player.y, obj.x, obj.y) <= obj.collision.distance) {

                    if (obj.textureName == 'speedBoost') {
                        player.state = 'boost'
                        player.stateTime = performance.now()
                        States.boost.func(player)
    
                        GameObjects.splice(objId, 1)
                        break
                    } else if (obj.damage.canDamage) {
                        // if (debug) console.log(`Player ${player.name} got ${obj.damage.value} damage`)
                        player.currentHealth -= obj.damage.value

                        if (player.currentHealth < 1) {
                            player.socket.emit('death')
                            // player.socket.disconnect()
                            player.socket.broadcast.emit('playerDisconnected', {data: playersInGame[playerId].name})
                            TickerObj.delete(`player_${player.name}`)
                            playersInGame.splice(playerId, 1)
                        }

                        GameObjects.splice(objId, 1)
                        break
                    }
                    
                }
                playerId++
            }
        } else if (obj.type == 'entity' && obj.attack.damageable) {
            for (let anotherObjId in GameObjects)  {
                let anotherObj = GameObjects[anotherObjId]
                if (anotherObj.type != 'object') continue

                if (anotherObj.damage.canDamage && 
                    (getDistance(anotherObj.x, anotherObj.y, obj.x, obj.y) <= anotherObj.collision.distance) && 
                    anotherObj.side == 'player') {
                    obj.health -= anotherObj.damage.value

                    GameObjects.splice(anotherObjId, 1)
                    if (anotherObjId < objId) objId-- 
                    if (obj.health <= 0) {
                        TickerObj.delete(`enemy_${obj.id}`)
                        GameObjects.splice(objId, 1)
                    }
                    
                    continue
                }
            }
        }

        if (!skip) objId++
    }
    let i = 0
    while (i < GameObjects.length-1) {
        let obj = GameObjects[i]
        if (obj.y > 1.15 || obj.y < -0.15 || obj.x > 1.15 || obj.x < -0.15) {
            // TickerObj.delete(`enemy_${obj.id}`)
            GameObjects.splice(i, 1)
            continue
        }
        i++
    }

    io.emit('move', {
        players: playersInGame.map(n => ({
            name: n.name, 
            x: n.x, 
            y: n.y, 
            texture: n.options.airshipTexture,
            maxHealth: n.maxHealth,
            currentHealth: n.currentHealth,
        })), 
        objects: GameObjects.map(n => ({
            id: n.id,
            x: n.x,
            y: n.y,
            scale: n.scale,
            rotate: n.rotate,
            textureName: n.textureName
        }))
    })
    
    
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

// TickerObj.append('enemyBulletShooter', () => {
//     for (let enemy of GameObjects) {
//         if (enemy.type != 'entity') continue
//         if (enemy.attack.enable) {
//             let bullet = createBullet(
//                 x=enemy.x, 
//                 y=enemy.y, 
//                 id=GameObjectCount, 
//                 textureName=enemy.attack.bulletTexture, 
//                 speed=enemy.attack.bulletSpeed,
//                 damage=enemy.attack.bulletDamage
//             )
//             bullet.rotate = Math.PI/2
//             bullet.side = 'enemy'
//             bullet.collision.enable = true
//             GameObjects.push(bullet)
//             GameObjectCount++
//         }
//     }
// }, 2000)

TickerObj.append('enemyCreator', () => {
    let enemy = createEnemy(x=0.50, y=-0.10, id=GameObjectCount)

    TickerObj.append(`enemy_${GameObjectCount}`, () => {
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
    }, 2000)

    GameObjects.push(enemy)
    GameObjectCount++
}, 5000)

TickerObj.append('boostGenerator', () => {
    GameObjects.push(createSpeedBoost(x=randint(3, 97)/100, y=-0.01, id=GameObjectCount))
    GameObjectCount++
}, 20000)





const tickerTick = setInterval(() => {
    TickerObj.tick()
}, 10)

// here we go
server.listen(3000, hostname, () => {
    console.log(`listening on http://${!online ? hostname : ip.address()}:3000`)
})