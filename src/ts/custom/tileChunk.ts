import * as PIXI from "pixi.js"
import Game from "../game/game";
import GameObject from "../game/gameObject";
import { HSVColor, RGBColor } from "../helpers/color";
import Range from "../helpers/range";
import Vector from "../helpers/vector";
import Vector3d from "../helpers/vector3d";
import Tile from "./tile";

export default class TileChunk extends GameObject {
	/**
	 * size in tiles
	 */
	public static CHUNK_SIZE = 10
	public static DEBUG = false

	/**
	 * position in chunk space
	 */
	public position: Vector3d

	public isVisible: boolean = true

	private tiles: Set<Tile> = new Set()
	private container: PIXI.Container = new PIXI.Container()
	private graphics: PIXI.Graphics
	private color: RGBColor
	private minBoundary: Vector
	private maxBoundary: Vector
	private highestZ: number = 0
	private shouldRecalcBounds: boolean = false
	
	
	
	constructor(game: Game, position: Vector3d) {
		super(game)

		this.position = position.clone()

		if(TileChunk.DEBUG) {
			this.graphics = new PIXI.Graphics()
			this.color = (new HSVColor(Range.getRandomDec(0, 1), 1, 1)).toRGB()
			this.game.renderer.debug.addChild(this.graphics)
		}

		this.recalcBoundary()

		this.game.renderer.isomap.addChild(this.container)
		this.container.zIndex = -this.position.x + this.position.y + this.position.z
		this.game.renderer.isomap.sortableChildren = true
		this.game.renderer.isomap.sortDirty = true
		this.game.renderer.isomap.sortChildren()
	}

	public tick(deltaTime: number) {
		super.tick(deltaTime)

		if(this.shouldRecalcBounds) {
			this.shouldRecalcBounds = false
			this.recalcBoundary()
		}

		let isOnScreen = this.game.renderer.camera.showsBox(this.minBoundary, this.maxBoundary.x - this.minBoundary.x, this.maxBoundary.y - this.minBoundary.y)
		if(isOnScreen && !this.isVisible) {
			this.isVisible = true
			this.container.visible = true
		}
		else if(!isOnScreen && this.isVisible) {
			this.isVisible = false
			this.container.visible = false
		}

		if(this.graphics) { 
			this.graphics.clear()

			this.graphics.lineStyle(5 / this.game.renderer.camera.zoom, this.color.toHex())
			this.graphics.beginFill(0x000000, 0)
			this.graphics.drawRect(this.minBoundary.x, this.minBoundary.y, this.maxBoundary.x - this.minBoundary.x, this.maxBoundary.y - this.minBoundary.y)
			this.graphics.endFill()
		}
	}

	public add(tile: Tile) {
		this.tiles.add(tile)
		tile.setContainer(this.container)
		tile.setChunk(this)

		this.container.sortableChildren = true
		this.container.sortDirty = true
		this.container.sortChildren()
		this.container.cacheAsBitmap = true

		let zPosition = tile.getPosition().z
		if(zPosition > this.highestZ) {
			this.highestZ = zPosition
			this.shouldRecalcBounds = true
		}
	}

	public remove(tile: Tile) {
		this.tiles.delete(tile)
		tile.setContainer(null)
		tile.setChunk(null)
	}

	private recalcBoundary() {
		this.minBoundary = new Vector(
			this.position.x * TileChunk.CHUNK_SIZE * Tile.TILE_SIZE / 2
				+ this.position.y * TileChunk.CHUNK_SIZE * Tile.TILE_SIZE / 2 - (0.5 * Tile.TILE_SIZE),
			(this.position.x + 2) * TileChunk.CHUNK_SIZE * -Tile.TILE_SIZE / 4
				+ this.position.y * TileChunk.CHUNK_SIZE * Tile.TILE_SIZE / 4 + TileChunk.CHUNK_SIZE / 4 * Tile.TILE_SIZE
				- Tile.TILE_SIZE / 2 * this.highestZ
		)

		this.maxBoundary = new Vector(
			(this.position.x + 2) * TileChunk.CHUNK_SIZE * Tile.TILE_SIZE / 2
				+ this.position.y * TileChunk.CHUNK_SIZE * Tile.TILE_SIZE / 2 + (0.5 * Tile.TILE_SIZE),
			this.position.x * TileChunk.CHUNK_SIZE * -Tile.TILE_SIZE / 4
				+ this.position.y * TileChunk.CHUNK_SIZE * Tile.TILE_SIZE / 4 + (TileChunk.CHUNK_SIZE + 4) / 4 * Tile.TILE_SIZE
		)
	}
}