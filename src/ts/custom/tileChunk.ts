import * as PIXI from "pixi.js"
import Game from "../game/game";
import GameObject from "../game/gameObject";
import { HSVColor, RGBColor } from "../helpers/color";
import Range from "../helpers/range";
import Vector from "../helpers/vector";
import Vector3d from "../helpers/vector3d";
import Tile from "./tile";
import TileLighting from "./tileLighting";

export enum TileChunkUpdate {
	DO_LIGHTS = 1 // there are only a few times where we want to update lighting, so this is an option and not the norm
}

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
	private lights: Set<TileLighting> = new Set()
	private container: PIXI.Container = new PIXI.Container()
	private graphics: PIXI.Graphics
	private color: RGBColor
	private minBoundary: Vector
	private maxBoundary: Vector
	private highestZ: number = 0
	private shouldRecalcBounds: boolean = false
	private forceUpdate: number = 0
	
	
	
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

		if(this.forceUpdate == 2) {
			this.container.cacheAsBitmap = false
			this.forceUpdate = 1
		}
		else if(this.forceUpdate == 1) {
			this.container.cacheAsBitmap = true
			this.forceUpdate = 0
		}

		if(this.game.renderer.camera) {
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
	}

	public add(tile: Tile) {
		this.tiles.add(tile)
		tile.setContainer(this.container)
		tile.setChunk(this)

		this.container.sortableChildren = true
		this.container.cacheAsBitmap = true

		let zPosition = tile.getPosition().z
		if(zPosition > this.highestZ) {
			this.highestZ = zPosition
			this.shouldRecalcBounds = true
		}

		this.update(tile)
	}

	public remove(tile: Tile) {
		this.tiles.delete(tile)
		tile.setContainer(null)
		tile.setChunk(null)

		this.update(tile)
	}

	public addLight(light: TileLighting) {
		this.lights.add(light)
	}

	public removeLight(light: TileLighting) {
		this.lights.delete(light)
	}

	/**
	 * convert the input position into chunk space
	 * @param position 
	 */
	public static tileToChunkSpace(position: Vector3d) {
		return Vector3d.getTempVector(100).copy(position).mul(1 / TileChunk.CHUNK_SIZE).foreach(Math.floor).clone()
	}

	/**
	 * update our cached bitmap if there's a change
	 * @param tile the tile that needs updating. tiles can force an update a chunk that they don't belong in, so tile isn't always in our tile set
	 * @param updateBitmask tells us to do or skip different parts of the update process
	 */
	public update(tile?: Tile, updateBitmask: TileChunkUpdate = 0) {
		this.forceUpdate = 2

		if(tile) {
			// reassign the tile's lights
			if(
				(updateBitmask & TileChunkUpdate.DO_LIGHTS) == 1
				&& this.tiles.has(tile)
			) {
				tile.removeAllLights()

				// add new lights to tile, skipping expensive sphere search done in TileLighting
				for(let light of this.lights) {
					if(light.isInRadius(tile.getPosition())) {
						tile.addLight(light)
					}
				}
			}
		}
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