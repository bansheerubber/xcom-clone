import * as PIXI from "pixi.js"
import GameObject from "../game/gameObject";
import BinaryFileReader from "../helpers/binaryFileReader";
import BinaryFileWriter from "../helpers/binaryFileWriter";
import { RGBColor } from "../helpers/color";
import Vector from "../helpers/vector";
import Vector3d from "../helpers/vector3d";
import Serializable from "./serializable";
import Stage, { StageLayer, StageRotation } from "./stage";
import Tile, { TileSprites } from "./tile";
import TileChunk from "./tileChunk";
import TileRaycast from "./tileRaycast";

export default class TileLight extends GameObject implements Serializable {
	public stage: Stage
	protected _position: Vector3d
	protected _radius: number
	protected _color: RGBColor
	protected icon: Tile
	protected iconBox: Tile

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
		this._position = position.clone()
		this._radius = radius
		this._color = color
		this.stage.addLight(this)
		this.createDebugTiles()

		this.calculateChunks()
		this.drawLight()
	}

	private createDebugTiles() {
		if(!this.icon || !this.iconBox || this.icon.isDestroyed || this.iconBox.isDestroyed) {
			this.icon?.destroy()
			this.iconBox?.destroy()
			
			this.icon = this.stage.createTile(this.position, TileSprites.LIGHT_INDEX, StageLayer.DEV_LIGHT_LAYER)
			this.icon.ignoreLights = true
			this.iconBox = this.stage.createTile(this.position, TileSprites.GHOST_INDEX, StageLayer.DEV_LIGHT_BOX_LAYER)
			this.iconBox.ignoreLights = true
		}
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

					let tile = this.stage.getMapTile(position)
					if(tile) {
						tile.addLight(this)
						this.affectedTiles.add(tile)
					}
				}
			}
		}
	}

	/**
	 * update all affected tiles' lighting without recalculating bounds
	 */
	protected updateTileLighting() {
		for(let tile of this.affectedTiles) {
			tile.calculateLighting()
		}
	}

	public isInRadius(position: Vector3d) {
		return position.dist(this.position) <= this.radius
	}

	/**
	 * whether or not the given position should be lit by this light
	 * @param position
	 */
	public hasEffect(tile: Tile) {
		let angle = Math.PI / 4 + this.stage.rotation * Math.PI / 2
		let towardsCamera = Vector3d.getTempVector(0).set(-Math.sin(angle), Math.cos(angle), 0)
		
		let positionAtOrigin = Vector3d.getTempVector(1).copy(tile.position).sub(this.position)
		positionAtOrigin.z = 0
		// if dot is above 0, then the blocks are closer to the camera than the light is (we cant see the sides of the tile that are lit)
		if(positionAtOrigin.dot(towardsCamera) >= -0.) {
			if(
				this.stage.getMapTile(Vector3d.getTempVector(2).copy(tile.position).$add(0, 0, 1))
				|| tile.position.z > this.position.z
			) {
				return false
			}
		}

		// below contains egg code
		// cast rays after we've ruled out easy-to-calculate cases
		let cast = TileRaycast.cast(this.stage, this.position, tile.position, [], true)
		if(cast) {
			if(cast.tile != tile) {
				return false
			}
			else if(cast.normal.dot(towardsCamera) <= 0.01) {
				return false
			}
			else {
				console.log(cast.normal, towardsCamera, cast.normal.dot(towardsCamera))
			}
		}

		return true
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
		let oldPosition = this.position?.clone()
		
		this._position = position
		this.calculateChunks() // we need to recalc chunks b/c our AOE has changed
		this.drawLight() // find new tiles within our bounds

		if(this.icon && this.iconBox && !this.icon.isDestroyed && !this.iconBox.isDestroyed) {
			this.icon.position = this._position
			this.iconBox.position = this._position
		}

		this.stage?.updateLight(this, oldPosition, this.position)

		this.createDebugTiles()
	}

	get position(): Vector3d {
		return this._position	
	}

	set radius(radius: number) {
		this._radius = radius
		this.calculateChunks() // we need to recalc chunks b/c our AOE has changed
		this.drawLight() // find new tiles within our bounds
	}

	get radius(): number {
		return this._radius
	}

	set color(color: RGBColor) {
		this._color = color
		this.updateTileLighting() // since our AOE doesn't change, we do not need to recalc bounds. skip that step and update tiles directly
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

		for(let tile of this.affectedTiles) {
			tile.removeLight(this)
		}

		this.stage.removeLight(this)

		this.icon?.destroy()
		this.iconBox?.destroy()

		delete this._color
		delete this._position
		delete this.icon
		delete this.iconBox
		delete this.affectedTiles
		delete this.chunks
	}
}