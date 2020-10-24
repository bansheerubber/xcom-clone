import * as PIXI from "pixi.js"
import GameObject from "../game/gameObject";
import GameObjectOptions from "../game/gameObjectOptions";
import BinaryFileReader from "../helpers/binaryFileReader";
import BinaryFileWriter from "../helpers/binaryFileWriter";
import { RGBColor } from "../helpers/color";
import Range from "../helpers/range";
import Vector from "../helpers/vector";
import Vector3d from "../helpers/vector3d";
import SpriteSheet from "../render/spriteSheet";
import Serializable from "./serializable";
import Stage, { StageLayer, StageRotation } from "./stage";
import TileChunk, { TileChunkUpdate } from "./tileChunk";
import TileLight from "./tileLight";

enum TILE_ADJACENT {
	NORTH = 0,
	EAST = 1,
	SOUTH = 2,
	WEST = 3,
}

export default class Tile extends GameObject implements Serializable {
	public static TILE_SIZE: number = 64

	protected chunk: TileChunk
	public sprite: SpriteSheet
	protected _ignoreLights: boolean = false
	/**
	 * the position of our tile in tilespace
	 */
	protected _position: Vector3d = new Vector3d(0, 0, 0)
	protected oldTint: RGBColor
	protected stage: Stage
	protected lights: Set<TileLight> = new Set()
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
		this.chunk?.update(this)
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
		this.chunk.update(this)
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

	set ignoreLights(input: boolean) {
		this._ignoreLights = input
		this.lights.clear()
		this.calculateLighting()
	}

	get ignoreLights(): boolean {
		return this._ignoreLights
	}

	public updateRotation() {
		this.updateSpritePosition()
		this.chunk?.update(this)
	}

	protected updateSpritePosition() {
		let xZIndex, yZIndex
		switch(this.stage.rotation) {
			case StageRotation.DEG_0: {
				xZIndex = 1
				yZIndex = 1
				break
			}

			case StageRotation.DEG_90: {
				xZIndex = 1
				yZIndex = -1
				break
			}

			case StageRotation.DEG_180: {
				xZIndex = -1
				yZIndex = -1
				break
			}

			case StageRotation.DEG_270: {
				xZIndex = -1
				yZIndex = 1
				break
			}
		}

		this.sprite.setPosition(this.stage.tileToWorldSpace(this.position))
		this.sprite.zIndex = -this.position.x * xZIndex + this.position.y * yZIndex + this.position.z + this.layer / 50
	}

	set position(vector: Vector3d) {
		let oldPosition = vector.clone()
		
		this._position.copy(vector)

		this.updateSpritePosition()

		let oldChunk = this.chunk
		this.stage.updateTile(this, oldPosition, this.position)
		this.chunk?.update(this, TileChunkUpdate.DO_LIGHTS)
		
		if(oldChunk && this.chunk != oldChunk) {
			oldChunk.update(this)
		}

		this.calculateLighting()
	}

	get position(): Vector3d {
		return this._position
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

	public removeAllLights() {
		this.lights.clear()
	}

	public removeLight(light: TileLight) {
		if(this.isDestroyed) {
			return
		}
		
		if(!this._ignoreLights) {
			this.lights.delete(light)

			if(!this.isDestroyed) {
				this.calculateLighting()	
			}
		}
	}

	public addLight(light: TileLight) {
		if(this.isDestroyed) {
			return
		}
		
		if(!this._ignoreLights) {
			this.lights.add(light)
		
			if(!this.isDestroyed) {
				this.calculateLighting()	
			}
		}
	}

	public calculateLighting() {
		if(this.isDestroyed) {
			return
		}
		
		let fog = this.position.z / 100
		let additive = new RGBColor(fog, fog, fog)
		for(let light of this.lights) {
			additive.add(light.color.clone().mul(Math.max(0, 1 - light.position.dist(this.position) / light.radius)))
		}
		this.additive = additive
	}

	/**
	 * gets the tile adjacent to this one on the same z-axis
	 */
	public getAdjacent(index: TILE_ADJACENT) {
		if(this.isDestroyed) {
			return
		}
		
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
			return this.stage.getMapTile(Vector3d.getTempVector(99))
		}
	}

	/**
	 * whether or not a tile is adjacent
	 */
	public isAdjacent(tile: Tile): boolean {
		for(let i = 0; i < 4; i++) {
			if(this.getAdjacent(i) == tile) {
				return true
			}
		}
		return false
	}

	public serialize(file: BinaryFileWriter, mode: number) {
		if(mode == 0) {
			file.writeInt16(this.type)
		}
	}

	public read(file: BinaryFileReader, mode: number) {
		if(mode == 0) {
			this.type = file.readInt16()
		}
	}

	public destroy() {
		super.destroy()
		this.chunk?.remove(this)
		this.sprite?.destroy()

		this.stage?.removeTile(this)

		// i don't trust garbage collectors to do their job
		delete this.chunk
		delete this.sprite
		delete this.position
		delete this.oldTint
		delete this.stage
		delete this.lights
	}
}