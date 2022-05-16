const { performance } = require('perf_hooks')

module.exports.Ticker = class Ticker {
    constructor() {
        this.data = {}
        this.speedRate = 1
    }

    append(key, func, delay) {
        this.data[key] = {
            func: func,
            startTime: performance.now(),
            delay: delay,
        }
    }

    changeDelay(key, delay) {
        this.data[key].startTime = performance.now()
        this.data[key].delay = delay
    }

    changeFunc(key, func) {
        this.data[key].func = func
    }

    changeKey(key, newKey) {
        this.data[newKey] = this.data[key]
        delete this.data[key]
    }

    tick() {
        for (let key in this.data) {
            if (performance.now()-this.data[key].startTime > this.data[key].delay) {
                this.data[key].startTime = performance.now()
                this.data[key].func()
            }
        }
    }
}