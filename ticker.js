const { performance } = require('perf_hooks')
module.exports.Ticker = class Ticker {
    constructor() {
        this.data = {} // data -> {anyKey: {func: function, ticksCount: number, currentTick: number}}
    }

    tick(leastTime=0) { // seconds
        let startTime = performance.now()
        for (let key in this.data) {
            this.data[key].currentTick++
            if (this.data[key].currentTick >= this.data[key].ticksCount) {
                this.data[key].func()
                this.data[key].currentTick = 0
            }
        }

        while ((performance.now()-startTime)/1000 < leastTime) {}
    }

    append(key, func, ticksCount) {
        this.data[key] = {
            func: func,
            ticksCount: ticksCount,
            currentTick: 0
        }
    }

    changeTicks(key, ticksCount) {
        this.data[key].ticksCount = ticksCount
    }

    changeFunc(key, func) {
        this.data[key].func = func
    }
}

