

class Screen {
    constructor() {
        this.renderer = new PIXI.Renderer({
            width: ScreenWidth,
            height: ScreenHeight,
            backgroundColor: 0x1099bb,
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
        this.ticker.start()
        
        this.draw()
        
        console.log('It works!')


        
    }

    render() {
        this.renderer.render(this.stage)
    }

    get screen() {
        return this.renderer.screen
    }

    draw() {
        this.circle = new PIXI.Graphics();
        this.circle.beginFill(0x5cafe2);
        this.circle.drawCircle(0, 0, 80);
        this.stage.addChild(this.circle);

        this.stage.on('pointermove', (e) => {
            this.circle.x = e.data.global.x
            this.circle.y = e.data.global.y
        })

    }
}