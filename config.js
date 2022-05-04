module.exports.debug = true
module.exports.online = true
module.exports.hostname = module.exports.online ? '0.0.0.0' : '127.0.0.1'

module.exports.createObject = () => ({
        id: 0,
        textureName: '',
        scale: 0.25, 
        rotate: 0, 
        x: 0, 
        y: 0,
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
    }
)

module.exports.createBullet = (x=0, y=0, id=0, textureName='bullet01') => {
    let object = module.exports.createObject()
    object.x = x
    object.y = y
    object.id = id
    object.rotate = 3*Math.PI/2
    object.textureName = textureName

    object.drop.enable = true
    object.drop.speedY = -0.5

    object.collision.canDamage = true
    object.collision.damage = 1
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

    object.collision.damageable = true
    return object
}
