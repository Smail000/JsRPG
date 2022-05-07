

module.exports.getDistance = function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2))
}

module.exports.randint = function randint(min, max) {
    max += 1
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min
}

module.exports.getCoordsByStep = (x0, y0, x1, y1, step) => {
    let w = x1 - x0
    let h = y1 - y0
    let d = (w**2 + h**2)**0.5
    let sin = h/d
    let cos = w/d
    return d <= step ? [x1, y1, true] : [x0+step*cos, y0+step*sin, false]
}