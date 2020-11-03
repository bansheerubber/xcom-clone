import * as PIXI from "pixi.js"
import Game from "../game/game";
import GameObject from "../game/gameObject";
import GameObjectOptions from "../game/gameObjectOptions";
import BinaryFileReader from "../helpers/binaryFileReader";
import BinaryFileWriter from "../helpers/binaryFileWriter";
import { RGBColor } from "../helpers/color";
import Vector3d from "../helpers/vector3d";
import WebFileReader from "../helpers/webFileReader";
import SpriteSheet from "../render/spriteSheet";
import Serializable from "./serializable";
import Stage, { StageLayer, StageRotation } from "./stage";
import type TileChunk from "./tileChunk";
import { TileChunkUpdate } from "./tileChunkUpdate";
import TileLight from "./tileLight";

interface SpritesheetPayload {
	frames: {
		[index: string]: SpriteDefinition
	}
}

interface SpriteDefinition {
	frame: {
		x: number,
		y: number,
		w: number,
		h: number,
	},
	rotated: boolean,
	trimmed: boolean,
	spriteSourceSize: {
		x: number,
		y: number,
		w: number,
		h: number,
	},
	sourceSize: {
		w: number,
		h: number,
	},
	custom: {
		isRotateable: boolean,
		isTall: boolean,
		isWall: boolean,
		isWallCorner: boolean,
	}
}

export enum TILE_ADJACENT {
	NORTH = 0,
	EAST = 1,
	SOUTH = 2,
	WEST = 3,
}

export enum TILE_DIAGONAL {
	NORTH_WEST = 4,
	NORTH_EAST = 5,
	SOUTH_EAST = 6,
	SOUTH_WEST = 7,
}

export enum TileSprites {
	SHEET = "./data/sprites/spritesheet.json",
	GHOST_INDEX = "ghost.png",
	LIGHT_INDEX = "light_icon.png",
	DEFAULT_TILE = "cube.png",
	OUTLINE_NORTH = "outline1.png",
	OUTLINE_WEST = "outline2.png",
	OUTLINE_SOUTH = "outline3.png",
	OUTLINE_EAST = "outline4.png",
	FULL_OUTLINE = "full_outline.png",
	DOT = "dot.png",
}

export default class Tile extends GameObject implements Serializable {
	public static TILE_SIZE: number = 64
	public static TILE_HEIGHT: number = 39
	public static TILE_BOTTOM_TO_TOP: number = 55
	public static TILE_LAYER_RESOLUTION: number = 50
	public static metadata: {
		[index: string]: {
			isRotateable: boolean,
			isTall: boolean,
			isWall: boolean,
			isWallCorner: boolean,
		}
	} = {}

	public sprite: SpriteSheet
	protected _type: number
	protected _typeName: string
	protected chunk: TileChunk
	protected _ignoreLights: boolean = false
	/**
	 * the position of our tile in tilespace
	 */
	protected _position: Vector3d = new Vector3d(0, 0, 0)
	protected oldTint: RGBColor
	protected stage: Stage
	protected lights: Set<TileLight> = new Set()
	public readonly layer: number

	constructor(game: Game, stage: Stage, spriteIndex: number | string = TileSprites.DEFAULT_TILE, layer: number = StageLayer.DEFAULT_LAYER, optionsOverride?: GameObjectOptions) {
		super(game, optionsOverride ? optionsOverride : {
			canTick: false,
		})

		this.layer = layer
		this.stage = stage

		this.sprite = new SpriteSheet(this.game, TileSprites.SHEET, this.game.renderer.isomap)
		this.sprite.isVisible = false

		if(typeof spriteIndex === "string") {
			this.typeName = spriteIndex
		}
		else {
			this.type = spriteIndex
		}
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
		this._type = type
		this._typeName = SpriteSheet.textureProperties[this.sprite.source][type]
		this.updateRotation()
	}
	
	get type(): number {
		return this._type
	}

	set typeName(type: string) {
		this.type = SpriteSheet.textureProperties[this.sprite.source].indexOf(type)
	}

	get typeName(): string {
		return this._typeName
	}

	get isWall(): boolean {
		return Tile.metadata[this.typeName].isWall
	}

	get isWallCorner(): boolean {
		return Tile.metadata[this.typeName].isWallCorner
	}

	get isRotatable(): boolean {
		return Tile.metadata[this.typeName].isRotateable
	}

	/**
	 * gets the rotation of the sprite based off of the type the tile was placed with. does not change as the camera rotates
	 */
	get rotation(): number {
		if(this.isRotatable) {
			return parseInt(this.typeName.match(/[1-4](?=\.png$)/g)[0])
		}
		else {
			return null
		}
	}

	/**
	 * gets the real rotation of the sprite as it is currently being rendered. changes as the camera rotates
	 */
	get spriteRotation(): number {
		if(this.isRotatable) {
			return parseInt(this.sprite.sheetName.match(/[1-4](?=\.png$)/g)[0])
		}
		else {
			return null
		}
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
		if(this.isRotatable) {
			let nextRotation = ((this.rotation - 1) + this.stage.rotation) % 4 + 1
			this.sprite.sheetName = this.typeName.replace(/[1-4](?=\.png$)/, `${nextRotation}`)
		}
		else {
			this.sprite.sheetIndex = this._type
		}

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
		this.sprite.zIndex = -this.position.x * xZIndex + this.position.y * yZIndex + this.position.z + this.layer / Tile.TILE_LAYER_RESOLUTION

		if(this.isWall) {
			if(
				this.isWallCorner && this.spriteRotation != 4
				|| (!this.isWallCorner && this.spriteRotation != 1 && this.spriteRotation != 4)
			) {
				this.sprite.zIndex += (1 / Tile.TILE_LAYER_RESOLUTION) / 2
			}
		}
	}

	set position(vector: Vector3d) {
		let oldPosition = this._position.clone()
		
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
			this.calculateLighting()
		}
	}

	public addLight(light: TileLight) {
		if(this.isDestroyed) {
			return
		}
		
		if(!this._ignoreLights) {
			this.lights.add(light)
			this.calculateLighting()	
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
	 * generate adjacents
	 */
	public *getAdjacents(): IterableIterator<Tile> {
		let north = this.getAdjacent(TILE_ADJACENT.NORTH)
		let east = this.getAdjacent(TILE_ADJACENT.EAST)
		let south = this.getAdjacent(TILE_ADJACENT.SOUTH)
		let west = this.getAdjacent(TILE_ADJACENT.WEST)

		if(north) {
			yield north
		}

		if(east) {
			yield east
		}

		if(south) {
			yield south
		}

		if(west) {
			yield west
		}
	}

	/**
	 * whether or not a tile is adjacent
	 */
	public isAdjacent(tile: Tile): boolean {
		for(let adjacent of this.getAdjacents()) {
			if(adjacent == tile) {
				return true
			}
		}
		return false
	}

	public getDiagonal(index: TILE_DIAGONAL): Tile {
		if(this.isDestroyed) {
			return
		}
		
		switch(index) {
			// north is negative y, west is negative x
			case TILE_DIAGONAL.NORTH_WEST: {
				Vector3d.getTempVector(99).copy(this.position).$add(-1, -1, 0)
				break
			}

			// north is negative y, east is positive x
			case TILE_DIAGONAL.NORTH_EAST: {
				Vector3d.getTempVector(99).copy(this.position).$add(1, -1, 0)
				break
			}

			// south is positive y, east is positive x
			case TILE_DIAGONAL.SOUTH_EAST: {
				Vector3d.getTempVector(99).copy(this.position).$add(1, 1, 0)
				break
			}

			// south is positive y, east is negative x
			case TILE_DIAGONAL.SOUTH_WEST: {
				Vector3d.getTempVector(99).copy(this.position).$add(-1, 1, 0)
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
	 * generate diagonals
	 */
	public *getDiagonals(): IterableIterator<Tile> {
		let north_west = this.getDiagonal(TILE_DIAGONAL.NORTH_WEST)
		let north_east = this.getDiagonal(TILE_DIAGONAL.NORTH_EAST)
		let south_east = this.getDiagonal(TILE_DIAGONAL.SOUTH_EAST)
		let south_west = this.getDiagonal(TILE_DIAGONAL.SOUTH_WEST)

		if(north_west) {
			yield north_west
		}

		if(north_east) {
			yield north_east
		}

		if(south_east) {
			yield south_east
		}

		if(south_west) {
			yield south_west
		}
	}

	/**
	 * whether or not a tile is diagonal
	 */
	public isDiagonal(tile: Tile): boolean {
		for(let diagonal of this.getDiagonals()) {
			if(diagonal == tile) {
				return true
			}
		}
		return false
	}

	public getTop(): Tile {
		return this.stage.getMapTile(Vector3d.getTempVector(99).copy(this.position).$add(0, 0, 1))
	}

	public getBottom(): Tile {
		return this.stage.getMapTile(Vector3d.getTempVector(99).copy(this.position).$add(0, 0, -1))
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
		delete this.lights
	}

	public static loadMetadata(fileName: string): Promise<void> {
		return new WebFileReader(fileName).readFile().then((result) => {
			let data: SpritesheetPayload = JSON.parse(result)
			for(let name in data.frames) {
				this.metadata[name] = data.frames[name].custom
			}
		})
	}
}