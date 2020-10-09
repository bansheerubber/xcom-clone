import { textChangeRangeIsUnchanged } from "typescript";
import GameObject from "../game/gameObject";
import BinaryFileReader from "../helpers/binaryFileReader";
import BinaryFileWriter from "../helpers/binaryFileWriter";
import { RGBColor } from "../helpers/color";
import Vector from "../helpers/vector";
import Vector3d from "../helpers/vector3d";
import Tile from "./tile";
import TileChunk from "./tileChunk";
import TileLighting from "./tileLighting";

enum StageSaveFile {
	BLANK_TILE = 2**16 - 1
}

export default class Stage extends GameObject {
	/**
	 * map for all the chunks in our stage
	 */
	private chunkMap: {
		[index: number]: TileChunk
	} = {}

	/**
	 * map for all the tiles in our stage. separated by layers. layer 0 is the main map, additional layers can contain special effects, etc
	 */
	public tileMap: {
		[layer: number]: {
			[uniqueIndex: number]: Tile
		}
	} = {}

	/**
	 * all of the lights
	 */
	public lights: Set<TileLighting> = new Set()

	private selectedTile: Tile
	private selectedTileOutline: Tile
	private maxPosition: Vector3d = new Vector3d(0, 0, 0)
	public readonly defaultLayer: number = 5;

	
	
	public createTile(position: Vector3d, spriteIndex: number = 13, layer: number = this.defaultLayer, tileClass: typeof Tile = Tile): Tile {
		if(!this.tileMap[layer]) {
			this.tileMap[layer] = {}
		}
		
		let tile = new tileClass(this.game, this, spriteIndex, layer)
		tile.setPosition(position.clone())
		return tile
	}

	public updateTile(tile: Tile) {
		let chunkPosition = TileChunk.tileToChunkSpace(tile.getPosition())
		if(!this.chunkMap[chunkPosition.unique2d()]) {
			this.chunkMap[chunkPosition.unique2d()] = new TileChunk(this.game, chunkPosition)
		}

		if(!this.tileMap[tile.layer]) {
			this.tileMap[tile.layer] = {}
		}

		if(
			this.tileMap[tile.layer][tile.getPosition().unique()]
			&& this.tileMap[tile.layer][tile.getPosition().unique()] != tile
		) {
			this.tileMap[tile.layer][tile.getPosition().unique()].destroy()
		}
		
		this.tileMap[tile.layer][tile.getPosition().unique()] = tile

		if(this.chunkMap[chunkPosition.unique2d()] != tile.getChunk()) {
			if(tile.getChunk()) {
				tile.getChunk().remove(tile)
			}
			
			this.chunkMap[chunkPosition.unique2d()].add(tile)
		}

		if(tile.getPosition().x + 1 > this.maxPosition.x) {
			this.maxPosition.x = tile.getPosition().x + 1
		}

		if(tile.getPosition().y + 1 > this.maxPosition.y) {
			this.maxPosition.y = tile.getPosition().y + 1
		}

		if(tile.getPosition().z + 1 > this.maxPosition.z) {
			this.maxPosition.z = tile.getPosition().z + 1
		}
	}

	public getMapTile(vector: Vector3d): Tile {
		return this.tileMap[this.defaultLayer][vector.unique()]
	}

	public getChunk(vector: Vector3d): TileChunk {
		return this.chunkMap[vector.unique2d()]
	}

	public selectTile(tile: Tile) {
		if(this.selectedTile) {
			this.selectedTile.unselect()
			this.selectedTile = null
			this.selectedTileOutline?.destroy()
			this.selectedTileOutline = null
		}

		this.selectedTile = tile

		if(this.selectedTile) {
			this.selectedTile.select()
			this.selectedTileOutline = this.createTile(this.selectedTile.getPosition(), 273, 6)
		}
	}

	public mouseToTileSpace(x: number, y: number): Vector3d {
		let {
			x: worldX,
			y: worldY
		} = this.game.renderer.camera.mouseToWorld(x, y)

		// transformation matrix, rotate by 45 degrees and apply sheer and scale of 2 on right column. magic number at the end was needed to adjust scaling of the axes
		let tileX = Math.floor((worldX * Math.cos(Math.PI / 4) - worldY * (Math.sin(Math.PI / 4) * 2)) / (Tile.TILE_SIZE / 2) * (1000 / 1414) + 0.5)
		let tileY = Math.floor((worldX * Math.sin(Math.PI / 4) + worldY * (Math.cos(Math.PI / 4) * 2)) / (Tile.TILE_SIZE / 2) * (999 / 1414) - 0.5)

		if(tileX < 0 || tileY < 0) {
			return null
		}
		else {
			return new Vector3d(tileX, tileY, 0)
		}
	}

	public getTileUnderMouse(x: number, y: number): Tile {
		let vector = this.mouseToTileSpace(x, y)

		if(!vector) {
			return null
		}

		let index = vector.unique()

		if(this.tileMap[this.defaultLayer][index]) {
			return this.tileMap[this.defaultLayer][index]
		}
		else {
			return null
		}
	}

	public selectTileUnderMouse(x: number, y: number) {
		let tile = this.getTileUnderMouse(x, y)
		if(tile) {
			if(tile != this.selectedTile) {
				this.selectTile(tile)
			}
			else {
				this.selectTile(null)
			}
		}
		else {
			this.selectTile(null)
		}
	}

	public save() {
		let file = new BinaryFileWriter("stage.egg")
		file.writeInt16(this.maxPosition.x)
		file.writeInt16(this.maxPosition.y)
		file.writeInt16(this.maxPosition.z)
		
		// write tiles to file
		let max2dIndex = this.maxPosition.x * this.maxPosition.y
		let maxIndex = this.maxPosition.x * this.maxPosition.y * this.maxPosition.z
		for(let i = 0; i < maxIndex; i++) {
			let position = Vector3d.getTempVector(97).set(
				i % this.maxPosition.x,
				Math.floor(i / this.maxPosition.x) % this.maxPosition.y,
				Math.floor(i / max2dIndex)
			)

			if(this.tileMap[this.defaultLayer][position.unique()]) {
				this.tileMap[this.defaultLayer][position.unique()].serialize(file, 0)
			}
			else {
				file.writeInt16(StageSaveFile.BLANK_TILE)
			}
		}

		// write lights to file
		file.writeInt16(this.lights.size)
		for(let light of this.lights) {
			light.serialize(file)
		}

		file.saveFile(9)
	}

	public async load(fileName: string) {
		let file = new BinaryFileReader(fileName)
		await file.readFile()

		let maxX = file.readInt16()
		let maxY = file.readInt16()
		let maxZ = file.readInt16()

		// read tiles
		let max2dIndex = maxX * maxY
		let maxIndex = maxX * maxY * maxZ
		for(let i = 0; i < maxIndex; i++) {
			let position = Vector3d.getTempVector(97).set(
				i % maxX,
				Math.floor(i / maxX) % maxY,
				Math.floor(i / max2dIndex)
			)

			let type = file.readInt16()
			if(type != 2**16 - 1) {
				this.createTile(position, type)
			}
		}

		// read lights
		let lightCount = file.readInt16()
		let tempColor = new RGBColor(0, 0, 0)
		for(let i = 0; i < lightCount; i++) {
			new TileLighting(this.game, this, new Vector3d(0, 0, 0), 0, tempColor).read(file)
		}
	}
}