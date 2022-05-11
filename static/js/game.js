
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
for (let i=-1;i<Math.ceil(window.innerHeight/(starsHeight*(app.renderer.width/1000)));i++) { // 
    var stars_obj = new SimpleObject(textures.starTexture)
    stars_obj.body.scale.set(app.renderer.width/1000)
    stars_obj.body.x = app.renderer.width*0.5
    stars_obj.body.y = i*starsHeight*(app.renderer.width/1000) + starsHeight*(app.renderer.width/1000)/2
    starsArr.push(stars_obj)
}

// Запуск звезд
app.ticker.add(delta => {
    for (let star of starsArr) {
        star.body.y += starsSpeed
        if (star.body.y > window.innerHeight+(starsHeight*(app.renderer.width/1000))/2) {
            star.body.y = -(starsHeight*(app.renderer.width/1000))/2
        }
    }
})

// Создание корабля
var airship = new SimpleObject(textures.airshipTexture)
airship.body.scale.set(0.33)
airship.body.x = app.renderer.width * 0.5
airship.body.y = app.renderer.height * 0.8

// Реация на движение
socket.on('move', (msg) => {
    // Отрисовка игроков
    for (var player of msg.players) {
        if (player.name != PlayerName) {
            if (Object.keys(otherPlayers).includes(player.name)) {
                otherPlayers[player.name].body.x = player.x * window.innerWidth
                otherPlayers[player.name].body.y = player.y * window.innerHeight
            } else {
                otherPlayers[player.name] = new SimpleObject(textures[player.texture])
                otherPlayers[player.name].body.scale.set(0.33)
                otherPlayers[player.name].body.x = app.renderer.width * 0.5
                otherPlayers[player.name].body.y = app.renderer.py * 0.8
            }
        }
    }

    // Отрисовка объектов
    let allObjectsIds = objects.map((n) => n.id)
    for (var obj of msg.objects) {

        if (allObjectsIds.includes(obj.id)) {
            objects.find((elem, id, _) => {
                if (obj.id == elem.id) {
                    objects[id].obj.body.x = obj.x * window.innerWidth
                    objects[id].obj.body.y = obj.y * window.innerHeight
                }
                return obj.id == elem.id
            })
        } else {
            let newObj = new SimpleObject(textures[obj.textureName])
            newObj.body.scale.set(obj.scale)
            newObj.body.rotation = obj.rotate
            newObj.body.x = obj.x * window.innerWidth
            newObj.body.y = obj.y * window.innerHeight
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

// Клик мыши или касание пальца (double click)
var touchAndClick = () => {
    let x = app.renderer.plugins.interaction.mouse.global.x
    let y = app.renderer.plugins.interaction.mouse.global.y
    if (!clicked) {
        clicked = true
        clickedCoords = [x, y]
        clickedTimeout = setTimeout(() => {clicked = false}, 200)
    } else {
        clicked = false
        clearInterval(clickedTimeout)

        if (((clickedCoords[0]-x)**2+(clickedCoords[1]-y)**2)**0.5 < 10) {
            alert('double tap')
        }
    } 
}
app.stage.on('mouseup', touchAndClick)
app.stage.on('touchend', touchAndClick)

// Реакция на отключенных пользователей
socket.on('playerDisconnected', (msg) => {
    for (let userName of Object.keys(otherPlayers)) {
        if (msg.data == userName) {
            otherPlayers[userName].body.destroy()
            delete otherPlayers[userName]
        }
    }
})

socket.on('fastMove', (msg) => {
    alert(`Превышена скорость движения: ${msg.data} `)
})

// Регистрация на игру
socket.emit('register', {
    name: PlayerName,
    x: airship.body.x/app.renderer.width,
    y: airship.body.y/app.renderer.height,
})




// Запуск рабочего цикла
app.ticker.start()

// Цикл отправки сообщений серверу
setInterval(() => { 
    if (coordChanged) {
        socket.emit('move', {
            x: airship.body.x/app.renderer.width,
            y: airship.body.y/app.renderer.height
        })
        coordChanged = false
    }
}, 10)

