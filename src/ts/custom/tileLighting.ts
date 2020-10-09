import { Vector } from "matter-js";
import * as PIXI from "pixi.js"
import { Vector3 } from "three";
import GameObject from "../game/gameObject";
import BinaryFileReader from "../helpers/binaryFileReader";
import BinaryFileWriter from "../helpers/binaryFileWriter";
import { RGBColor } from "../helpers/color";
import Vector3d from "../helpers/vector3d";
import Serializable from "./serializable";
import Stage from "./stage";
import Tile from "./tile";
import TileChunk from "./tileChunk";

export default class TileLighting extends GameObject implements Serializable {
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
		this.stage.lights.add(this)
	}

	public drawLight() {
		for(let tile of this.affectedTiles) {
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

	public serialize(file: BinaryFileWriter) {
		file.writeInt16(this.position.x)
		file.writeInt16(this.position.y)
		file.writeInt16(this.position.z)
		file.writeInt16(this.radius)

		let color = this.color.toHex()
		file.writeByte((color & 0xFF0000) >> 16)
		file.writeByte((color & 0x00FF00) >> 8)
		file.writeByte(color & 0x0000FF)
	}

	public read(file: BinaryFileReader) {
		this.position = this.position.set(file.readInt16(), file.readInt16(), file.readInt16())
		this.radius = file.readInt16()
		this.color = RGBColor.from((file.readByte() << 16) | (file.readByte() << 8) | file.readByte())
	}

	public destroy() {
		super.destroy()
		
		for(let chunk of this.chunks) {
			chunk.removeLight(this)
		}
		delete this.chunks

		for(let tile of this.affectedTiles) {
			tile.removeLight(this)
		}
		delete this.affectedTiles

		this.stage.lights.delete(this)
	}
}