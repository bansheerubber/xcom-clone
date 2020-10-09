import { Vector } from "matter-js";
import * as PIXI from "pixi.js"
import { Vector3 } from "three";
import GameObject from "../game/gameObject";
import { RGBColor } from "../helpers/color";
import Vector3d from "../helpers/vector3d";
import Stage from "./stage";
import Tile from "./tile";
import TileChunk from "./tileChunk";

export default class TileLighting extends GameObject {
	public stage: Stage
	protected _position: Vector3d
	protected _radius: number
	protected _color: RGBColor

	/**
	 * the tiles who are lit up by this light source
	 */
	protected affectedTiles: Set<Tile> = new Set()

	/**
	 * the chunks this light belongs in
	 */
	protected chunks: Set<TileChunk> = new Set()



	constructor(game, stage: Stage, position: Vector3d, radius: number, color: RGBColor) {
		super(game)
		this.stage = stage
		this._position = position
		this._radius = radius
		this._color = color

		this.calculateChunks()
		this.drawLight()
	}

	public drawLight() {
		for(let tile of this.affectedTiles.values()) {
			tile.removeLight(this)
		}
		this.affectedTiles.clear()

		for(let x = -this.radius; x <= this.radius; x++) {
			let dy = Math.floor(Math.sqrt(this.radius ** 2 - x ** 2))
			for(let y = -dy; y <= dy; y++) {
				let dz = Math.floor(Math.sqrt(this.radius ** 2 - (x ** 2 + y ** 2)))
				for(let z = -dz; z <= dz; z++) {
					let position = Vector3d.getTempVector(0).copy(this.position).$add(x, y, z).foreach(Math.floor)

					if(position.x < 0 || position.y < 0 || position.z < 0) {
						continue
					}

					this.stage.getMapTile(position)?.addLight(this)
				}
			}
		}
	}

	protected calculateChunks() {
		// calculate what chunks we belong in
		for(let chunk of this.chunks) {
			chunk.removeLight(this)
		}
		this.chunks = new Set()

		for(let x = -this.radius; x <= this.radius; x++) {
			for(let y = -this.radius; y <= this.radius; y++) {
				let chunk = this.stage.getChunk(TileChunk.tileToChunkSpace(Vector3d.getTempVector(0).copy(this.position).$add(x, y, 0)))
				if(!this.chunks.has(chunk) && chunk) {
					this.chunks.add(chunk)
					chunk.addLight(this)
				}
			}
		}
	}

	set position(position: Vector3d) {
		this._position = position
		this.calculateChunks()
		this.drawLight()
	}

	get position(): Vector3d {
		return this._position	
	}

	set radius(radius: number) {
		this._radius = radius
		this.calculateChunks()
		this.drawLight()
	}

	get radius(): number {
		return this._radius
	}

	set color(color: RGBColor) {
		this._color = color
		this.drawLight()
	}

	get color(): RGBColor {
		return this._color
	}
}