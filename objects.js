const { performance } = require('perf_hooks')

module.exports.States = { // seconds
    base: {
        duration: NaN,
        func: (obj) => {
            obj.options.bulletTexture = 'bullet01'
            obj.options.bulletDamage = 1
            obj.options.bulletSpeed = -0.005
        }
    },

    boost: {
        duration: 5,
        func: (obj) => {
            obj.options.bulletTexture = 'bullet21'
            obj.options.bulletDamage = 5
            obj.options.bulletSpeed = -0.01
        }
    },

    god: {
        duration: 9999999999,
        func: (obj) => {
            obj.options.bulletTexture = 'bullet49'
            obj.options.bulletDamage = 999
            obj.options.bulletSpeed = -0.01
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
    currentHealth: 5,
    maxHealth: 100,

    options: {
        airshipTexture: 'airshipTexture',
        bulletTexture: 'bullet01',
        bulletDamage: 1,
        bulletSpeed: -0.005,
    }
})

module.exports.createObject = () => ({
    type: 'object',
    side: 'none',
    id: 0,
    textureName: '',
    scale: 0.25, 
    rotate: 0, 
    x: 0, 
    y: 0,
    health: 1,
    damage: {
        value: 0,
        canDamage: false,
        damageable: false,
    },
    movement: {
        enable: false,
        speedX: 0,
        speedY: 0,
    },
    collision: {
        enable: false,
        distance: 0,
    },
})

module.exports.createEntity = () => ({
    type: 'entity',
    id: 0,
    textureName: '',
    scale: 0.25, 
    rotate: 0, 
    x: 0, 
    y: 0,
    health: 1,
    attack: {
        enable: false,
        damageable: false,
        bulletDamage: 0,
        bulletTexture: '',
        bulletSpeed: 0,
    },
    movement: {
        enable: false,
        points: [
            {
                x: 0,
                y: 0,
                step: 0,
            },
        ],
        correntPointId: 0,
        destroyAfterGoal: false,
        loop: false,
    },
})

module.exports.createBullet = (x=0, y=0, id=0, textureName='bullet01', speed=-0.005, damage=1) => {
    let object = module.exports.createObject()

    object.x = x
    object.y = y
    object.id = id
    object.rotate = 3*Math.PI/2
    object.textureName = textureName
    object.side = 'player'

    object.movement.enable = true
    object.movement.speedY = speed

    object.damage.canDamage = true
    object.damage.value = damage

    object.collision.distance = 0.03
    return object
}

module.exports.createSpeedBoost = (x=0, y=0, id=0) => {
    let object = module.exports.createObject()

    object.x = x
    object.y = y
    object.id = id
    object.textureName = 'speedBoost'

    object.movement.enable = true
    object.movement.speedY = 0.001

    object.collision.enable = true
    object.collision.distance = 0.03
    return object
}


module.exports.createEnemy = (x=0, y=0, id=0) => {
    let object = module.exports.createEntity()

    object.x = x
    object.y = y
    object.id = id
    object.rotate = Math.PI
    object.scale = 0.15
    object.textureName = 'simpleEnemy'
    object.health = 5

    object.movement.enable = true
    object.movement.loop = true
    object.movement.points = [
        {
            x: 0.5,
            y: 0.5,
        },
        {
            x: 0.1,
            y: 0.1,
        },
        {
            x: 0.9,
            y: 0.1,
        },
        {
            x: 0.5,
            y: 0.5,
        } 
    ]
    for (let point of object.movement.points) {point.step = 0.004}

    object.attack.damageable = true
    object.attack.enable = true
    object.attack.bulletSpeed = 0.005
    object.attack.bulletTexture = 'bullet02'
    object.attack.bulletDamage = 1
    return object
}
