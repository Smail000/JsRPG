
const socket = io()

// Получение имени
while (true) {
    var PlayerName = prompt('Введите имя >', '')
    if (PlayerName != 'null' && PlayerName.trim() != '') break
}

// Создание окна
const app = new Screen()
window.app = app

// Формирование звезд
for (let i=-1;i<Math.ceil(window.innerHeight/(starsHeight*(app.px/10)));i++) { // 
    var stars_obj = new SimpleObject(textures.starTexture)
    stars_obj.body.scale.set(app.px/10)
    stars_obj.body.x = app.px*50
    stars_obj.body.y = i*starsHeight*(app.px/10) + starsHeight*(app.px/10)/2
    starsArr.push(stars_obj)
}

// Запуск звезд
app.ticker.add(delta => {
    for (let star of starsArr) {
        star.body.y += starsSpeed
        if (star.body.y > window.innerHeight+(starsHeight*(app.px/10))/2) {
            star.body.y = -(starsHeight*(app.px/10))/2
        }
    }
})

// Создание корабля
var airship = new SimpleObject(textures.airshipTexture)
airship.body.scale.set(0.33)
airship.body.x = app.px * 50
airship.body.y = app.py * 80

// Реация на движение
socket.on('move', (msg) => {
    // Отрисовка игроков
    for (var player of msg.players) {
        if (player.name != PlayerName) {
            if (Object.keys(otherPlayers).includes(player.name)) {
                otherPlayers[player.name].body.x = (player.x/100) * window.innerWidth
                otherPlayers[player.name].body.y = (player.y/100) * window.innerHeight
            } else {
                otherPlayers[player.name] = new SimpleObject(textures.airshipTexture)
                otherPlayers[player.name].body.scale.set(0.33)
                otherPlayers[player.name].body.x = app.px * 50
                otherPlayers[player.name].body.y = app.py * 80
            }
        }
    }

    // Отрисовка объектов
    let allObjectsIds = objects.map((n) => n.id)
    for (var obj of msg.objects) {

        if (allObjectsIds.includes(obj.id)) {
            objects.find((elem, id, _) => {
                if (obj.id == elem.id) {
                    objects[id].obj.body.x = (obj.x/100) * window.innerWidth
                    objects[id].obj.body.y = (obj.y/100) * window.innerHeight
                }
                return obj.id == elem.id
            })
        } else {
            let newObj = new SimpleObject(textures[obj.textureName])
            newObj.body.scale.set(obj.scale)
            newObj.body.rotation = obj.rotate
            newObj.body.x = (obj.x/100) * window.innerWidth
            newObj.body.y = (obj.y/100) * window.innerHeight
            objects.push({
                id: obj.id,
                obj: newObj
            })
        }
    }

    // Сборшик мусора
    allObjectsIds = msg.objects.map((n) => n.id)
    let objIdsToRemove = []
    for (let obj of objects) {
        if (!allObjectsIds.includes(obj.id)) {
            obj.obj.body.destroy()
            objIdsToRemove.push(obj.id)
        }
    }
    objects = objects.filter(n => !objIdsToRemove.includes(n.id))

})

// Запуск корабля в движение
app.stage.on('pointermove', (e) => {
    airship.body.x = e.data.global.x // app.renderer.plugins.interaction.mouse.global.x
    airship.body.y = e.data.global.y // app.renderer.plugins.interaction.mouse.global.y
    coordChanged = true
})

// Реакция на отключенных пользователей
socket.on('playerDisconnected', (msg) => {
    for (let userName of Object.keys(otherPlayers)) {
        if (msg.data == userName) {
            otherPlayers[userName].body.destroy()
            delete otherPlayers[userName]
        }
    }
})

// Регистрация на игру
socket.emit('register', {
    name: PlayerName,
    x: airship.body.x/app.px,
    y: airship.body.y/app.py,
})



// Запуск рабочего цикла
app.ticker.start()

// Цикл отправки сообщений серверу
setInterval(() => { 
    if (coordChanged) {
        socket.emit('move', {
            x: airship.body.x/app.px,
            y: airship.body.y/app.py
        })
        coordChanged = false
    }
}, 10)

