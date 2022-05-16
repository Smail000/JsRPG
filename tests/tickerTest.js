const { Ticker } = require('../ticker.js')

const TickerObj = new Ticker()
var globalVar = 1

TickerObj.append('key1', () => {
    console.log(`Here is wait time: ${globalVar}`)
    globalVar++
    TickerObj.changeDelay('key1', globalVar)
}, globalVar)

while (true) {
    TickerObj.tick()
}