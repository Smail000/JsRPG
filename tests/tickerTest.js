const { Ticker } = require('../ticker.js')

const TickerObj = new Ticker()
var globalVar = 0

TickerObj.append('key1', () => {
    globalVar++
    console.log(`Here is ${globalVar} count`)
}, 5)

while (true) {
    TickerObj.tick(0.1)
}