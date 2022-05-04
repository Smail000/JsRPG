module.exports.debug = true
module.exports.online = true
module.exports.hostname = module.exports.online ? '0.0.0.0' : '127.0.0.1'

module.exports.getBullet = (
        x = 0, 
        y = 0, 
        id = 0, 
        textureName = 'bullet01', 
        rotate = 3*Math.PI/2,
        scale = 0.25,
    ) => ({
        id: id,
        textureName: textureName,
        scale: scale, 
        rotate: rotate, 
        x: x, 
        y: y,
        drop: {
            enable: true,
            speedX: 0,
            speedY: -0.5,
        },
        collision: {
            enable: false,
            distance: 0,
            damage: 0,
        }
    }
)
