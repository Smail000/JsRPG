


class Screen {
    constructor() {
        this.renderer = new PIXI.Renderer({
            width: ScreenWidth,
            height: ScreenHeight,
            backgroundColor: 0x090033, //PIXI.utils.rgb2hex([16,0,89]),
            resolution: 1,
        })

        document.body.appendChild(this.renderer.view)

        window.addEventListener("resize", () => {
            ScreenWidth = window.innerWidth-12
            ScreenHeight = window.innerHeight-21
            this.renderer.resize(ScreenWidth, ScreenHeight)
        })

        
        this.ticker = new PIXI.Ticker()

        this.stage = new PIXI.Container()
        this.stage.interactive = true



        this.ticker.add(this.render.bind(this), PIXI.UPDATE_PRIORITY.LOW)

        // this.ticker.start()
        
    }
    
    render() {
        this.renderer.render(this.stage)
    }

    get screen() {
        return this.renderer.screen
    }

    on_resize(func) {
        window.addEventListener("resize", () => {
            func()
        })
    }
}

class SimpleObject {
    constructor(texture) {
        this.body = new PIXI.Sprite(texture)
        this.body.anchor.set(0.5)
        this.body.interactive = true
        this.body.buttonMode = true
        window.app.stage.addChild(this.body)
    }

    change_texture(texture) {
        this.body.texture = texture
    }
}