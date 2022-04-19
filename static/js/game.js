
const socket = io()

// Получение имени
while (true) {
    var name = prompt('Введите имя >', '')
    // console.log(name);
    if (name != 'null' && name.trim() != '') {break}
}

// Создание окна
const app = new Screen()
window.app = app


// "Генерация" звезд
for (let i=-1;i<Math.ceil(window.innerHeight/(starsHeight*(app.px/10)))+1;i++) { // 
    var stars_obj = new SimpleObject(textures.starTexture)
    stars_obj.obj.scale.set(app.px/10)
    stars_obj.obj.x = app.px*50
    stars_obj.obj.y = i*starsHeight*(app.px/10) + starsHeight*(app.px/10)/2
    starsArr.push(stars_obj)
}

// Запуск звезд
app.ticker.add(delta => {
    for (let star of starsArr) {
        star.obj.y += starsSpeed
        if (star.obj.y > window.innerHeight+(starsHeight*(app.px/10))/2) {
            star.obj.y = -(starsHeight*(app.px/10))/2
        }
    }
})

// Создание корабля
var airship = new SimpleObject(textures.airshipTexture)
airship.obj.scale.set(0.33)
airship.obj.x = app.px * 50
airship.obj.y = app.py * 80

// Реация на движение
socket.on('move', (msg) => {
    // console.log(msg)
    for (var player of msg.players) {
        if (player.name != name) {
            if (Object.keys(otherPlayers).includes(player.name)) {
                otherPlayers[player.name].obj.x = (player.x/100) * window.innerWidth
                otherPlayers[player.name].obj.y = (player.y/100) * window.innerHeight
            } else {
                otherPlayers[player.name] = new SimpleObject(textures.airshipTexture)
                otherPlayers[player.name].obj.scale.set(0.33)
                otherPlayers[player.name].obj.x = app.px * 50
                otherPlayers[player.name].obj.y = app.py * 80
            }
        }
    }

    let allObjectsIds = objects.map((n) => n.id)
    for (var obj of msg.objects) {

        if (allObjectsIds.includes(obj.id)) {
            objects.find((elem, id, _) => {
                if (obj.id == elem.id) {
                    objects[id].obj.obj.x = (obj.x/100) * window.innerWidth
                    objects[id].obj.obj.y = (obj.y/100) * window.innerHeight
                    // console.log(objects[id].obj.x);
                    // console.log(objects[id].obj.y);
                }
                return obj.id == elem.id
            })
        } else {
            let newObj = new SimpleObject(textures[obj.textureName])
            newObj.obj.scale.set(obj.scale)
            newObj.obj.rotation = obj.rotate
            newObj.obj.x = (obj.x/100) * window.innerWidth
            newObj.obj.y = (obj.y/100) * window.innerHeight
            objects.push({
                id: obj.id,
                obj: newObj
            })
        }
    }
    allObjectsIds = msg.objects.map((n) => n.id)
    let objIdsToRemove = []
    for (let obj of objects) {
        if (!allObjectsIds.includes(obj.id)) {
            obj.obj.obj.destroy()
            // console.log(obj);
            objIdsToRemove.push(obj.id)
        }
    }
    objects = objects.filter(n => !objIdsToRemove.includes(n.id))

})

// Запуск корабля в движение
app.stage.on('pointermove', (e) => {
    airship.obj.x = e.data.global.x // app.renderer.plugins.interaction.mouse.global.x
    airship.obj.y = e.data.global.y // app.renderer.plugins.interaction.mouse.global.y
    coordChanged = true
})

socket.on('collision', obj => {
    if (obj.textureName == 'speedBoost') {
        console.log('speedBoost activated!')
    }
})

// Реакция на отключенных пользователей
socket.on('playerDisconnected', (msg) => {
    for (let userName of Object.keys(otherPlayers)) {
        if (msg.data == userName) {
            otherPlayers[userName].obj.destroy()
            delete otherPlayers[userName]
        }
    }
})

// Регистрация на игру
socket.emit('register', {
    'name': name,
    'x': airship.obj.x/app.px,
    'y': airship.obj.y/app.py,
})



// Запуск рабочего цикла
app.ticker.start()

// Цикл отправки сообщений серверу
setInterval(() => { 
    if (coordChanged) {
        socket.emit('move', {
            'x': airship.obj.x/app.px,
            'y': airship.obj.y/app.py
        })
        coordChanged = false
    }
}, 10)

// Пули)
setInterval(() => {
    createTestObj()
}, 500)

