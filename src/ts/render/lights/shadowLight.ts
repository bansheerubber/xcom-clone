import * as PIXI from "pixi.js"
import vertexShader from "./shaders/passthrough.vert"
import fragmentShader from "./shaders/shadowmask.frag"
import fragmentShader2 from "./shaders/shadowlight.frag"
import Sprite from "../sprite";
import Game from "../../game/game";
import Vector from "../../helpers/vector";
import { RGBColor } from "../../helpers/color";
import GameObject from "../../game/gameObject";

export class ShadowMapGenerator extends PIXI.Filter {
	public game: Game


	
	constructor(game: Game) {
		super(vertexShader, fragmentShader, {
			"resolutionMode": {
				type: "int",
				value: 2,
			},
			"zoom": {
				type: "float",
				value: 1,
			},
		})
		this.game = game
	}

	public apply(filterManager: PIXI.systems.FilterSystem, input: PIXI.RenderTexture, output: PIXI.RenderTexture, clear: boolean, currentState: object): void {
		if(ShadowLight.renderTextureResolution == 256) {
			this.uniforms.resolutionMode = 1;
		}
		else if(ShadowLight.renderTextureResolution == 512) {
			this.uniforms.resolutionMode = 2;
		}
		else if(ShadowLight.renderTextureResolution == 1024) {
			this.uniforms.resolutionMode = 3;
		}

		this.uniforms.zoom = this.game.renderer.camera.zoom
		
		filterManager.applyFilter(this, input, output, clear)
	}
}

export class ShadowMapRenderer extends PIXI.Filter {
	public game: Game
	public color: RGBColor
	public startLimit: number = 0
	public endLimit: number = Math.PI * 2
	public textureSize: number = 512.0
	public zoom: number


	
	constructor(game: Game) {
		super(vertexShader, fragmentShader2, {
			"textureSize": {
				type: "float",
				value: 512.0,
			},
			"color": {
				type: "v4",
				value: null,
			},
			"widthHeight": {
				type: "v2",
				value: null,
			},
			"adjustment": {
				type: "float",
				value: null,
			}
		})
		this.game = game
		this.blendMode = PIXI.BLEND_MODES.ADD
		this.autoFit = false
	}

	public apply(filterManager: PIXI.systems.FilterSystem, input: PIXI.RenderTexture, output: PIXI.RenderTexture, clear: boolean, currentState: PIXI.State): void {
		this.uniforms.textureSize = Math.ceil(this.textureSize - 2)

		this.uniforms.color[0] = this.color.r
		this.uniforms.color[1] = this.color.g
		this.uniforms.color[2] = this.color.b
		this.uniforms.color[3] = this.color.a

		this.uniforms.adjustment = input.frame.width / this.textureSize

		filterManager.applyFilter(this, input, output, clear)
	}
}

export default class ShadowLight {
	public static renderTextureResolution: number = 512
	public static shadowLights: Set<ShadowLight> = new Set<ShadowLight>()
	
	public game: Game
	public position: Vector = new Vector(0, 0)
	public color: RGBColor = new RGBColor(1, 1, 1)
	public radius: number = 256.0
	public startLimit: number = 0
	public endLimit: number = Math.PI * 2
	
	private renderTexture: PIXI.RenderTexture
	private sprite: Sprite
	private filter: ShadowMapRenderer



	constructor(game: Game, position: Vector, color: RGBColor, radius: number) {
		this.game = game

		this.position = position
		this.color = color
		this.radius = radius

		this.filter = new ShadowMapRenderer(game)

		this.game.renderer.shadowLights.add(this)

		ShadowLight.shadowLights.add(this)
		
		this.createRenderTexture()
	}

	public createRenderTexture(): void {
		if(this.renderTexture) {
			this.renderTexture.destroy()
		}

		if(this.sprite) {
			this.sprite.destroy()
		}

		this.renderTexture = PIXI.RenderTexture.create({
			width: ShadowLight.renderTextureResolution,
			height: ShadowLight.renderTextureResolution,
		})

		this.sprite = new Sprite(this.game, this.renderTexture, this.game.renderer.shadows)
		this.sprite.sprite.anchor.x = 0
		this.sprite.sprite.anchor.y = 0
		this.sprite.sprite.filters = [this.filter]
	}

	public tick(): void {
		let start = performance.now()
		let container = this.game.renderer.shadowMasks
		
		// floor our position, required to display shadows at all
		this.position.x = this.position.x
		this.position.y = this.position.y

		// floor our radius
		this.radius = Math.floor(this.radius)
		
		// save original container position values for later
		let originalScaleX = container.scale.x
		let originalScaleY = container.scale.y
		let originalPivotX = container.pivot.x
		let originalPivotY = container.pivot.y

		// set the texture size of the shader, so it knows how to look through the shadow map texture
		this.filter.textureSize = Math.floor(this.radius * 2) * originalScaleX
		// set the color of the shader
		this.filter.color = this.color
		// passing the range to the shader
		this.filter.startLimit = this.startLimit
		this.filter.endLimit = this.endLimit

		// figure out the ratio between the render texture resolution and the radius of the light
		let newScale = (ShadowLight.renderTextureResolution / 2) / this.radius

		// set the position of the sprite
		this.sprite.setScale(new Vector(1 / newScale, 1 / newScale))
		this.sprite.setPosition(new Vector(-this.radius + this.position.x, -this.radius + this.position.y))

		// apply new position values to container for correct rendering
		container.scale.x *= newScale
		container.scale.y *= newScale
		container.scale.x /= originalScaleX // dumb that we have to do this but we just have to
		container.scale.y /= originalScaleY
		container.pivot.x = -originalPivotX - this.radius - this.position.x + originalPivotX
		container.pivot.y = -originalPivotY - this.radius - this.position.y + originalPivotY
		
		// render the container
		this.game.renderer.render(container, this.renderTexture)

		// apply original position values to container
		container.scale.x = originalScaleX
		container.scale.y = originalScaleY
		container.pivot.x = originalPivotX
		container.pivot.y = originalPivotY

		if(this.game.debug) {
			this.game.debug.shadowTime += performance.now() - start
		}
	}

	// sets the shadow render texture resolution to one of 3 modes
	public static setTextureMode(mode: number): void {
		if(mode >= 1 && mode <=3) {
			this.renderTextureResolution = 2 ** (mode + 7)
		}

		// go through all the shadows and have them regenerate their render textures
		for(let shadowLight of this.shadowLights.values()) {
			shadowLight.createRenderTexture()
		}
	}

	public destroy(): void {
		this.renderTexture.destroy()
		this.sprite.destroy()
		ShadowLight.shadowLights.delete(this)
	}
}