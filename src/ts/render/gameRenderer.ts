import * as PIXI from "pixi.js"
import Game from "../game/game";
import Camera from "./camera";
import RenderObject from "./renderObject";
import SpriteChunkSet from "./spriteChunkSet";
import ShadowLight, { ShadowMapGenerator } from "./lights/shadowLight";

export default class GameRenderer {
	public game: Game
	public pixiApp: PIXI.Application
	public objects: RenderObject[] = []

	public dynamic: PIXI.Container = new PIXI.Container() // moves with a camera
	public isomap: PIXI.Container = new PIXI.Container() // hex map
	public shadowMasks: PIXI.Container = new PIXI.Container() // contains all the masks used to make the shadow sprites
	public shadows: PIXI.Container = new PIXI.Container() // contains all the shadow sprites
	public static: PIXI.Container = new PIXI.Container() // does not move with a camera
	public debug: PIXI.Container = new PIXI.Container() // moves with the camera

	public chunks: Map<PIXI.Container, SpriteChunkSet> = new Map<PIXI.Container, SpriteChunkSet>()

	public shadowLights: Set<ShadowLight> = new Set<ShadowLight>()

	public enabled: boolean = true

	private _camera: Camera

	
	
	constructor(game: Game) {
		this.game = game

		PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST
		PIXI.settings.ROUND_PIXELS = false

    // setup the pixi application
    this.pixiApp = new PIXI.Application({
			width: document.getElementById("canvasContainer").clientWidth,
			height: document.getElementById("canvasContainer").clientHeight,
			backgroundColor: 0x333333,
			resizeTo: document.getElementById("canvasContainer"),
			powerPreference: "high-performance",
			antialias: true,
		})
		
		this.pixiApp.stage.addChild(this.isomap)
		this.pixiApp.stage.addChild(this.shadows)
		this.pixiApp.stage.addChild(this.dynamic)
		this.pixiApp.stage.addChild(this.static)
		this.pixiApp.stage.addChild(this.debug)

		this.chunks.set(this.dynamic, new SpriteChunkSet(this.dynamic))
		this.chunks.set(this.shadowMasks, new SpriteChunkSet(this.shadowMasks))

		this.shadowMasks.filters = [new ShadowMapGenerator(this.game)] // add shadow map generation filter to shadowmasks

		document.getElementById("canvasContainer").appendChild(this.pixiApp.view)
		this.pixiApp.view.id = "canvas"
		this.pixiApp.view.onselect = function() {
			return false
		}
		this.pixiApp.stop() // don't automatically render
	}

	// pass through for rendering on the renderer
	public render(object: PIXI.DisplayObject, destination?: PIXI.RenderTexture): void {
		this.pixiApp.renderer.render(object, destination)
	}

	public tick(deltaTime: number): void {
		if(this._camera) {
			this._camera.tick(deltaTime) // have the camera apply its transformations
		}
		
		// render shadow maps
		for(let shadowLight of this.shadowLights.values()) {
			shadowLight.tick()
		}

		this.pixiApp.render() // render everything
	}

	public updateCamera(x: number, y: number, zoom: number, rotation: number): void {
		this.dynamic.pivot.x = x
		this.dynamic.pivot.y = y

		this.dynamic.scale.x = zoom
		this.dynamic.scale.y = zoom

		this.dynamic.rotation = rotation


		this.debug.pivot.x = x
		this.debug.pivot.y = y

		this.debug.scale.x = zoom
		this.debug.scale.y = zoom

		this.debug.rotation = rotation


		this.isomap.pivot.x = x
		this.isomap.pivot.y = y

		this.isomap.scale.x = zoom
		this.isomap.scale.y = zoom

		this.isomap.rotation = rotation

		
		this.shadowMasks.pivot.x = x
		this.shadowMasks.pivot.y = y

		this.shadowMasks.scale.x = zoom
		this.shadowMasks.scale.y = zoom

		this.shadowMasks.rotation = rotation


		this.shadows.pivot.x = Math.floor(x)
		this.shadows.pivot.y = Math.floor(y)

		this.shadows.scale.x = zoom
		this.shadows.scale.y = zoom

		this.shadows.rotation = rotation
	}

	set camera(camera: Camera) {
		// if we have a camera, call the deactivated callback on it
		if(this._camera) {
			this._camera.onDeActivated()
		}

		this._camera = camera
		camera.onActivated() // call the activated callback on the new active camera
	}

	get camera(): Camera {
		return this._camera
	}

	get width(): number {
		return this.pixiApp.view.width
	}

	get height(): number {
		return this.pixiApp.view.height
	}
	
	public getGPUName(): string {
		let gpuName = undefined
		let canvas = document.getElementById("canvas") as HTMLCanvasElement
		let gl = canvas.getContext("webgl2") as WebGLRenderingContext
		
		if(gl) {
			let dbgRenderInfo = gl.getExtension("WEBGL_debug_renderer_info")
			if(dbgRenderInfo != null)  {
				gpuName = gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL)
			}
		
			return gpuName
		}
		else {
			return "No GPU?"
		}
	}

	public addObject(renderObject: RenderObject): void {
		this.objects.push(renderObject)
	}

	public removeObject(renderObject: RenderObject): void {
		let index = this.objects.indexOf(renderObject)
		delete this.objects[index]
		this.objects.splice(index, 1)
	}

	public addDynamicFilter(input: PIXI.Filter): void {
		if(this.dynamic.filters == undefined) {
			this.dynamic.filters = []
		}

		let newArray = []
		for(let filter of this.dynamic.filters) {
			newArray.push(filter)
		}
		newArray.push(input)
		this.dynamic.filters = newArray
	}

	public removeDynamicFilter(input: PIXI.Filter): void {
		if(this.dynamic.filters != undefined) {
			let newArray = []
			for(let filter of this.dynamic.filters) {
				if(filter != input) {
					newArray.push(filter)
				}
			}
			this.dynamic.filters = newArray
		}
	}
}