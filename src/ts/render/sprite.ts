import * as PIXI from "pixi.js"
import { gameClass } from "../network/networkDecorators";
import RenderObject from "./renderObject";
import Game from "../game/game";
import Vector from "../helpers/vector";
import { RGBColor } from "../helpers/color";
import Physical from "./physical";
import Camera from "./camera";
import SpriteChunk from "./spriteChunk";

@gameClass
export default class Sprite extends RenderObject implements Physical {
	public sprite: PIXI.Sprite
	public cameras: Camera[] = []
	public chunk: SpriteChunk
	
	private container: PIXI.Container
	private _scale: Vector = new Vector(1, 1)
	private _position: Vector = new Vector(0, 0)



	constructor(game: Game, resource?: string | PIXI.Texture, customContainer: PIXI.Container = game.renderer.dynamic) {
		super(game, {
			canTick: false
		})

		// create empty sprite
		if(resource == undefined) {
			this.sprite = new PIXI.Sprite(undefined)
		}
		// create from texture
		else if(resource instanceof PIXI.Texture) {
			this.sprite = new PIXI.Sprite(resource)
		}
		// create from URL
		else {
			this.sprite = PIXI.Sprite.from(resource)
		}

		this.sprite.anchor.x = 0.5
		this.sprite.anchor.y = 0.5

		this.container = customContainer
		let chunkSet = this.game.renderer.chunks.get(customContainer)
		if(chunkSet === undefined) {
			customContainer.addChild(this.sprite)
		}
	}

	public setPosition(position: Vector): void {
		this.sprite.transform.position.x = position.x
		this.sprite.transform.position.y = position.y

		this._position.x = position.x
		this._position.y = position.y

		let chunkSet = this.game.renderer.chunks.get(this.container)
		if(chunkSet) {
			let oldChunk = this.chunk
			if(oldChunk != (this.chunk = chunkSet.addToSpriteChunk(this)) && oldChunk) {
				oldChunk.remove(this)
			}
			else if(this.chunk && oldChunk) {
				this.chunk.updateSprite(this)
			}
		}
	}

	public getPosition(): Vector {
		this._position.x = this.sprite.transform.position.x
		this._position.y = this.sprite.transform.position.y
		return this._position
	}

	public setScale(scale: Vector): void {
		this.sprite.transform.scale.x = scale.x
		this.sprite.transform.scale.y = scale.y

		this._scale.x = scale.x
		this._scale.y = scale.y
	}

	public getScale(): Vector {
		this._scale.x = this.sprite.transform.scale.x
		this._scale.y = this.sprite.transform.scale.y
		return this._scale
	}

	set rotation(rotation: number) {
		this.sprite.rotation = rotation
	}

	get rotation(): number {
		return this.sprite.rotation
	}

	set texture(resource: string | PIXI.Texture) {
		if(resource instanceof PIXI.Texture) {
			this.sprite.texture = resource
		}
		else {
			this.sprite.texture = PIXI.Texture.from(resource)
		}
	}

	get texture(): string | PIXI.Texture {
		return this.sprite.texture
	}

	set tint(color: RGBColor) {
		this.sprite.tint = color.toHex()
	}

	get tint(): RGBColor {
		return RGBColor.from(this.sprite.tint)
	}

	set opacity(opacity: number) {
		this.sprite.alpha = opacity
	}

	get opacity(): number {
		return this.sprite.alpha
	}

	set blendMode(mode: PIXI.BLEND_MODES) {
		this.sprite.blendMode = mode
	}

	get blendMode(): PIXI.BLEND_MODES {
		return this.sprite.blendMode
	}

	get width(): number {
		return this.sprite.width
	}

	get height(): number {
		return this.sprite.height
	}

	set isVisible(value: boolean) {
		this.sprite.visible = value
	}

	get isVisible(): boolean {
		return this.sprite.visible
	}

	public destroy(): void {
		super.destroy()

		this.sprite.destroy()
		this.chunk?.remove(this)
	}
}