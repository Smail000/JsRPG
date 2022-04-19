


class Screen {
    constructor() {
        this.renderer = new PIXI.Renderer({
            width: ScreenWidth,
            height: ScreenHeight,
            backgroundColor: 0x090033, //PIXI.utils.rgb2hex([16,0,89]),
            resolution: 1,
        });
        document.body.appendChild(this.renderer.view);

        this.px = this.renderer.width / 100
        this.py = this.renderer.height / 100

        window.addEventListener("resize", () => {
            ScreenWidth = window.innerWidth-12
            ScreenHeight = window.innerHeight-21
            this.renderer.resize(ScreenWidth, ScreenHeight)

            this.px = this.renderer.width / 100
            this.py = this.renderer.height / 100
        });

        
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
        this.obj = new PIXI.Sprite(texture)
        this.obj.anchor.set(0.5)
        this.obj.interactive = true
        this.obj.buttonMode = true
        window.app.stage.addChild(this.obj)
    }

    change_texture(texture) {
        // console.log(1);
        this.obj.texture = texture
    }
}