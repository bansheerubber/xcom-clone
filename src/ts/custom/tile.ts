import * as PIXI from "pixi.js"
import GameObject from "../game/gameObject";
import GameObjectOptions from "../game/gameObjectOptions";
import { RGBColor } from "../helpers/color";
import Range from "../helpers/range";
import Vector from "../helpers/vector";
import Vector3d from "../helpers/vector3d";
import SpriteSheet from "../render/spriteSheet";
import Stage from "./stage";
import TileChunk from "./tileChunk";
import TileLighting from "./tileLighting";

enum TILE_ADJACENT {
	NORTH = 0,
	EAST = 1,
	SOUTH = 2,
	WEST = 3,
}

export default class Tile extends GameObject {
	public static TILE_SIZE: number = 64

	protected chunk: TileChunk
	public sprite: SpriteSheet
	/**
	 * the position of our tile in tilespace
	 */
	protected position: Vector3d = new Vector3d(0, 0, 0)
	protected oldTint: RGBColor
	protected stage: Stage
	protected lights: Set<TileLighting> = new Set()
	public readonly layer: number



	constructor(game, stage: Stage, spriteIndex: number = 13, layer: number = 0, optionsOverride?: GameObjectOptions) {
		super(game, optionsOverride ? optionsOverride : {
			canTick: false,
		})

		this.layer = layer
		this.stage = stage

		this.sprite = new SpriteSheet(this.game, "./data/sprites/spritesheet test.json", this.game.renderer.isomap)
		this.sprite.isVisible = false
		this.sprite.sheetIndex = spriteIndex
	}

	set tint(tint: RGBColor) {
		this.sprite.tint = tint
	}

	get tint(): RGBColor {
		return this.sprite.tint
	}

	set additive(additive: RGBColor) {
		this.sprite.additive = additive
	}

	get additive(): RGBColor {
		return this.sprite.additive
	}

	set opacity(opacity: number) {
		this.sprite.opacity = opacity
	}

	get opacity(): number {
		return this.sprite.opacity
	}

	set type(type: number) {
		this.sprite.sheetIndex = type
	}
	
	get type(): number {
		return this.sprite.sheetIndex
	}

	set blendMode(blend: PIXI.BLEND_MODES) {
		this.sprite.blendMode = blend
	}

	get blendMode(): PIXI.BLEND_MODES {
		return this.sprite.blendMode
	}

	public setPosition(vector: Vector3d) {
		if(this.stage.tileMap[this.layer][this.getPosition().unique()] == this) {
			delete this.stage.tileMap[this.layer][this.getPosition().unique()] // clear last position in tilemap
		}
		
		this.position.copy(vector)

		let spritePosition = this.sprite.getPosition()
		spritePosition.x = this.position.x * Tile.TILE_SIZE / 2 + this.position.y * Tile.TILE_SIZE / 2 
		spritePosition.y = this.position.x * -Tile.TILE_SIZE / 4 + this.position.y * Tile.TILE_SIZE / 4 - this.position.z * Tile.TILE_SIZE / 2

		this.sprite.setPosition(spritePosition)
		this.sprite.zIndex = -this.position.x + this.position.y + this.position.z + this.layer / 50

		let oldChunk = this.chunk
		this.stage.updateTile(this)
		if(this.chunk) {
			this.chunk.update()
		}
		
		if(oldChunk && this.chunk != oldChunk) {
			oldChunk.update()
		}

		this.calculateLighting()
	}

	public getPosition(): Vector3d {
		return this.position.clone()
	}
	
	public setContainer(container) {
		this.sprite.container = container
	}

	public setChunk(chunk: TileChunk) {
		this.chunk = chunk
		this.sprite.isVisible = true
	}

	public getChunk(): TileChunk {
		return this.chunk
	}

	public unselect() {
		
	}

	public select() {
		
	}

	public removeLight(light: TileLighting) {
		this.lights.delete(light)
		this.calculateLighting()
	}

	public addLight(light: TileLighting) {
		this.lights.add(light)
		this.calculateLighting()
	}

	protected calculateLighting() {
		let fog = this.position.z / 100
		let additive = new RGBColor(fog, fog, fog).toHex()
		for(let light of this.lights) {
			additive += light.color.clone().mul(Math.max(0, 1 - light.position.dist(this.position) / light.radius)).toHex()
		}
		this.additive = RGBColor.from(additive)
	}

	/**
	 * gets the tile adjacent to this one on the same z-axis
	 */
	public getAdjacent(index: TILE_ADJACENT) {
		switch(index) {
			// north is negative y
			case TILE_ADJACENT.NORTH: {
				Vector3d.getTempVector(99).copy(this.position).$add(0, -1, 0)
				break
			}

			// east is positive x
			case TILE_ADJACENT.EAST: {
				Vector3d.getTempVector(99).copy(this.position).$add(1, 0, 0)
				break
			}

			// south is positive y
			case TILE_ADJACENT.SOUTH: {
				Vector3d.getTempVector(99).copy(this.position).$add(0, 1, 0)
				break
			}

			// west is negative x
			case TILE_ADJACENT.WEST: {
				Vector3d.getTempVector(99).copy(this.position).$add(-1, 0, 0)
				break
			}
		}

		if(Vector3d.getTempVector(99).x < 0 || Vector3d.getTempVector(99).y < 0 || Vector3d.getTempVector(99).z < 0) {
			return null
		}
		else {
			return this.stage.tileMap[this.stage.defaultLayer][Vector3d.getTempVector(99).unique()]
		}
	}

	public destroy() {
		super.destroy()
		this.chunk?.remove(this)
		this.chunk = null
		this.sprite?.destroy()
		this.sprite = null

		if(this.stage.tileMap[this.layer][this.getPosition().unique()]) {
			delete this.stage.tileMap[this.layer][this.getPosition().unique()]
		}
	}
}