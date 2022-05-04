
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


var textures = {
    airshipTexture: new PIXI.Texture.from(`assets/airship/10B.png`),
    starTexture: new PIXI.Texture.from(`assets/stars/Stars.png`),
    speedBoost: new PIXI.Texture.from(`assets/boxes/1.png`),
}

for (let i = 1; i < 66; i++) {
    i = (i < 10 ? `0${i}` : i).toString()
    textures[`bullet${i}`] = new PIXI.Texture.from(`assets/bullets/${i}.png`)
}

// Функции
// Рандомное чилсо от min включая до max включая
function randint(min, max) {
    return Math.floor(Math.random() * (max+1 - min)) + min
}