const { performance } = require('perf_hooks')
module.exports.debug = true
module.exports.online = true
module.exports.hostname = module.exports.online ? '0.0.0.0' : '127.0.0.1'

module.exports.speedLimit = 5
module.exports.speedLimitBorder = 10

module.exports.States = { // seconds
    base: {
        duration: NaN,
        func: (obj) => {
            obj.options.bulletTexture = 'bullet01'
            obj.options.bulletDamage = 1
            obj.options.bulletSpeed = -0.5
        }
    },

    boost: {
        duration: 5,
        func: (obj) => {
            obj.options.bulletTexture = 'bullet21'
            obj.options.bulletDamage = 5
            obj.options.bulletSpeed = -1
        }
    },
}

module.exports.createPlayer = (name, socket, x, y) => ({
    name: name,
    socket: socket,
    x: x,
    y: y,
    state: 'base',
    stateTime: performance.now(),
    speedLimitReachedTimes: 0,
    options: {
        airshipTexture: 'airshipTexture',
        bulletTexture: 'bullet01',
        bulletDamage: 1,
        bulletSpeed: -0.5,
        health: 100
    }
})

module.exports.createObject = () => ({
    id: 0,
    textureName: '',
    scale: 0.25, 
    rotate: 0, 
    x: 0, 
    y: 0,
    health: 1,
    drop: {
        enable: false,
        speedX: 0,
        speedY: 0,
    },
    collision: {
        enable: false,
        damageable: false,
        canDamage: false,
        distance: 0,
        damage: 0,
    }
})

module.exports.createBullet = (x=0, y=0, id=0, textureName='bullet01', speed=-0.5, damage=1) => {
    let object = module.exports.createObject()
    object.x = x
    object.y = y
    object.id = id
    object.rotate = 3*Math.PI/2
    object.textureName = textureName

    object.drop.enable = true
    object.drop.speedY = speed

    object.collision.canDamage = true
    object.collision.damage = damage
    object.collision.distance = 3
    return object
}

module.exports.createSpeedBoost = (x=0, y=0, id=0) => {
    let object = module.exports.createObject()
    object.x = x
    object.y = y
    object.id = id
    object.textureName = 'speedBoost'

    object.drop.enable = true
    object.drop.speedY = 0.1

    object.collision.enable = true
    object.collision.distance = 3
    return object
}


module.exports.createEnemy = (x=0, y=0, id=0) => {
    let object = module.exports.createObject()
    object.x = x
    object.y = y
    object.id = id
    object.rotate = Math.PI
    object.textureName = 'simpleEnemy'
    object.health = 5

    object.collision.damageable = true
    return object
}
