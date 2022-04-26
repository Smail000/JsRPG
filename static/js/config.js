
var ScreenWidth = window.innerWidth-12
var ScreenHeight = window.innerHeight-21

const online = true
var debug = true

var coordChanged = false

var starsHeight = 1024
var starsSpeed = 2.5
var starsArr = []
var otherPlayers = {}
var objects = [] // objects -> {id: number, obj: object}

var bulletSize = .15


var textures = {
    airshipTexture: new PIXI.Texture.from(`assets/airship/10B.png`),
    starTexture: new PIXI.Texture.from(`assets/stars/Stars.png`),
    speedBoost: new PIXI.Texture.from(`assets/boxes/1.png`),
}

for (let i = 1; i < 66; i++) {
    i = (i < 10 ? `0${i}` : i).toString()
    textures[`bullet${i}`] = new PIXI.Texture.from(`assets/bullets/${i}.png`)
    console.log(textures);
}

// Функции
// Рандомное чилсо от nim включая до max включая
function randint(min, max) {
    return Math.floor(Math.random() * (max+1 - min)) + min
  }

// Создание тестового обьекта
function createTestObj() {
    let i = randint(11, 19)
    socket.emit('createObject', {
        textureName: `bullet${i < 10 ? `0${i}` : i}`,
        scale: bulletSize, 
        rotate: -Math.PI/2, 
        x: airship.obj.x/app.px, 
        y: airship.obj.y/app.py-1, 
        cmd: {
            drop: {
                speed: -0.5
            },
            attack: {
                damage: 10
            }
        }, 
        collision: {
            enable: false,
            distance: 1
        }
    })
}

//
// function createTestObj() {
//     socket.emit('createObject', {
//         textureName: `speedBoost`,
//         scale: 1, 
//         rotate: 0, 
//         x: airship.obj.x/app.px, 
//         y: airship.obj.y/app.py-1, 
//         cmd: {
//             drop: {
//                 speed: -0.5
//             },
//             attack: {
//                 damage: 10
//             }
//         }, 
//         collision: false
//     })
// }