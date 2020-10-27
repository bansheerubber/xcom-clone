import { textChangeRangeIsUnchanged } from "typescript";
import GameObject from "../game/gameObject";
import BinaryFileReader from "../helpers/binaryFileReader";
import BinaryFileWriter from "../helpers/binaryFileWriter";
import { RGBColor } from "../helpers/color";
import Rotation from "../helpers/rotation";
import Vector from "../helpers/vector";
import Vector3d from "../helpers/vector3d";
import ControllableCamera from "./controllableCamera";
import Tile, { TileSprites } from "./tile";
import TileChunk from "./tileChunk";
import TileLight from "./tileLight";

enum StageSaveFile {
	VERSION = 1,
	BLANK_TILE = 2**16 - 1,
	REPEAT_TILE = 2**16 - 2
}

export enum StageRotation {
	DEG_0,
	DEG_90,
	DEG_180,
	DEG_270,
}

export enum StageLayer {
	DEFAULT_LAYER = 5,
	DEV_LIGHT_LAYER = 6,
	DEV_LIGHT_BOX_LAYER = 7,
	DEV_GHOST_LAYER = 8,
	DEV_GHOST_BOX_LAYER = 9,
}

export default class Stage extends GameObject {
	/**
	 * map for all the chunks in our stage
	 */
	private chunkMap: Map<number, TileChunk> = new Map()

	private chunks: Set<TileChunk> = new Set()

	/**
	 * map for all the tiles in our stage. separated by layers. layer 0 is the main map, additional layers can contain special effects, etc
	 */
	private tileMap: {
		[layer: number]: Map<number, Tile>
	} = {}

	private tiles: Set<Tile> = new Set()

	/**
	 * all of the lights
	 */
	private lights: Set<TileLight> = new Set()

	/**
	 * map for all the different lights
	 */
	private lightMap: Map<number, TileLight> = new Map()

	private _rotation: StageRotation = StageRotation.DEG_0
	private selectedTile: Tile
	private selectedTileOutline: Tile
	private maxPosition: Vector3d = new Vector3d(0, 0, 0)

	public destroy() {
		// destroy lights
		for(let light of new Set(this.lights)) {
			light.destroy()
		}

		// destroy chunks
		for(let chunk of new Set(this.chunks)) {
			chunk.destroy()
		}
		
		// destroy tiles
		for(let tile of new Set(this.tiles)) {
			tile.destroy()
		}

		delete (this.game.renderer.camera as ControllableCamera).stage

		delete this.chunkMap
		delete this.chunks
		delete this.tileMap
		delete this.tiles
		delete this.lights
		delete this.lightMap
	}
	
	public createTile(position: Vector3d, spriteIndex: number | string = 13, layer: number = StageLayer.DEFAULT_LAYER, tileClass: typeof Tile = Tile): Tile {
		if(!this.tileMap[layer]) {
			this.tileMap[layer] = new Map()
		}
		
		let tile = new tileClass(this.game, this, spriteIndex, layer)
		tile.position = position

		this.tiles.add(tile)

		return tile
	}

	public removeTile(tile: Tile) {
		this.tileMap[tile.layer].delete(tile.position.unique())
		this.tiles.delete(tile)
	}

	public updateTile(tile: Tile, oldPosition: Vector3d, newPosition: Vector3d) {
		let chunkPosition = TileChunk.tileToChunkSpace(tile.position)
		if(!this.chunkMap.get(chunkPosition.unique2d())) {
			let chunk = new TileChunk(this.game, this, chunkPosition)
			this.chunkMap.set(chunkPosition.unique2d(), chunk)
			this.chunks.add(chunk)
		}

		if(!this.tileMap[tile.layer]) {
			this.tileMap[tile.layer] = new Map()
		}

		if(
			this.tileMap[tile.layer].get(newPosition.unique())
			&& this.tileMap[tile.layer].get(newPosition.unique()) != tile
		) {
			this.tileMap[tile.layer].get(newPosition.unique()).destroy()
		}
		
		this.tileMap[tile.layer].delete(oldPosition.unique())
		this.tileMap[tile.layer].set(newPosition.unique(), tile)

		if(this.chunkMap.get(chunkPosition.unique2d()) != tile.getChunk()) {
			if(tile.getChunk()) {
				tile.getChunk().remove(tile)
			}
			
			this.chunkMap.get(chunkPosition.unique2d()).add(tile)
		}

		if(newPosition.x + 1 > this.maxPosition.x) {
			this.maxPosition.x = tile.position.x + 1
		}

		if(newPosition.y + 1 > this.maxPosition.y) {
			this.maxPosition.y = tile.position.y + 1
		}

		if(newPosition.z + 1 > this.maxPosition.z) {
			this.maxPosition.z = tile.position.z + 1
		}
	}

	public addLight(light: TileLight) {
		this.lights.add(light)
		this.updateLight(light, null, light.position)
	}

	public removeLight(light: TileLight) {
		this.lights.delete(light)
		this.lightMap.delete(light.position.unique())
	}

	public updateLight(light: TileLight, oldPosition: Vector3d, position: Vector3d) {
		if(oldPosition) {
			this.lightMap.delete(oldPosition.unique())
		}

		if(position) {
			this.lightMap.set(position.unique(), light)
		}
	}

	public getMapTile(vector: Vector3d): Tile {
		return this.tileMap[StageLayer.DEFAULT_LAYER].get(vector.unique())
	}

	public getLight(position: Vector3d): TileLight {
		return this.lightMap.get(position.unique())
	}

	public getChunk(vector: Vector3d): TileChunk {
		return this.chunkMap.get(vector.unique2d())
	}

	public removeChunk(chunk: TileChunk) {
		this.chunkMap.delete(chunk.position.unique())
		this.chunks.delete(chunk)
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
			this.selectedTileOutline = this.createTile(this.selectedTile.position, 273, 6)
		}
	}

	public worldToTileSpace(position: Vector, dontFloor = false): Vector3d {
		let {
			x: worldX,
			y: worldY
		} = position
		
		let angle = Math.PI / 4 + Math.PI / 2 * this.rotation
		worldY += Tile.TILE_BOTTOM_TO_TOP

		// transformation matrix, rotate by 45 degrees and apply sheer and scale of 2 on right column. magic number at the end was needed to adjust scaling of the axes
		let tileX = (worldX * Math.cos(angle) - worldY * (Math.sin(angle) * 2)) / (Tile.TILE_SIZE / 2) * (1000 / 1414)
		let tileY = (worldX * Math.sin(angle) + worldY * (Math.cos(angle) * 2)) / (Tile.TILE_SIZE / 2) * (999 / 1414)
			
		if(dontFloor) {
			return new Vector3d(tileX, tileY, 0)
		}
		else {
			switch(this.rotation) {
				case StageRotation.DEG_90: {
					tileX += 1
					break
				}
	
				case StageRotation.DEG_180: {
					tileX += 1
					tileY += 1
					break
				}
	
				case StageRotation.DEG_270: {
					tileY += 1
					break
				}
			}

			return new Vector3d(tileX, tileY, 0).foreach(Math.floor)
		}
	}

	public tileToWorldSpace(position: Vector3d): Vector {
		let xSpriteSpace, xTileSpace, ySpriteSpace, yTileSpace
		switch(this.rotation) {
			case StageRotation.DEG_0: {
				xSpriteSpace = 1
				xTileSpace = 1
				ySpriteSpace = 1
				yTileSpace = 1
				break
			}

			case StageRotation.DEG_90: {
				xSpriteSpace = -1
				xTileSpace = 1
				ySpriteSpace = 1
				yTileSpace = -1
				break
			}

			case StageRotation.DEG_180: {
				xSpriteSpace = 1
				xTileSpace = -1
				ySpriteSpace = 1
				yTileSpace = -1
				break
			}

			case StageRotation.DEG_270: {
				xSpriteSpace = -1
				xTileSpace = -1
				ySpriteSpace = 1
				yTileSpace = 1
				break
			}
		}
		
		let x = xSpriteSpace * (position.x * xTileSpace * Tile.TILE_SIZE / 2 + position.y * yTileSpace * Tile.TILE_SIZE / 2)
		let y = ySpriteSpace * (position.x * xTileSpace * -Tile.TILE_SIZE / 4 + position.y * yTileSpace * Tile.TILE_SIZE / 4 - position.z * Tile.TILE_HEIGHT)
		return Vector.getTempVector(0).set(x, y)
	}

	public mouseToTileSpace(x: number, y: number): Vector3d {
		let vector = this.worldToTileSpace(this.game.renderer.camera.mouseToWorld(x, y))
		if(vector.x < 0 || vector.y < 0) {
			return null
		}
		else {
			return vector
		}
	}

	public getTileUnderMouse(x: number, y: number): Tile {
		let vector = this.mouseToTileSpace(x, y)
		if(!vector) {
			return null
		}

		let index = vector.unique()

		if(this.tileMap[StageLayer.DEFAULT_LAYER].get(index)) {
			return this.tileMap[StageLayer.DEFAULT_LAYER].get(index)
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

	public set rotation(rotation: StageRotation) {
		let savedCameraTile = this.worldToTileSpace(this.game.renderer.camera.position, true)
		this._rotation = rotation
		this.game.renderer.camera.position.copy(this.tileToWorldSpace(savedCameraTile))

		// TODO improve rotation efficency
		for(let chunk of this.chunks) {
			for(let tile of chunk.tiles) {
				tile.updateRotation()
			}
		}
	}

	public get rotation(): StageRotation {
		return this._rotation
	}

	public save() {
		let file = new BinaryFileWriter("stage.egg")
		file.writeInt16(StageSaveFile.VERSION)
		file.writeByte(this.maxPosition.x)
		file.writeByte(this.maxPosition.y)
		file.writeByte(this.maxPosition.z)

		let rememberedType = -1
		let rememberedTypeCount = 0
		
		// write tiles to file
		let max2dIndex = this.maxPosition.x * this.maxPosition.y
		let maxIndex = this.maxPosition.x * this.maxPosition.y * this.maxPosition.z
		for(let i = 0; i < maxIndex; i++) {
			let position = Vector3d.getTempVector(97).set(
				i % this.maxPosition.x,
				Math.floor(i / this.maxPosition.x) % this.maxPosition.y,
				Math.floor(i / max2dIndex)
			)

			let type = this.tileMap[StageLayer.DEFAULT_LAYER].get(position.unique())?.type
			type = type ? type : StageSaveFile.BLANK_TILE

			// do optimizations for every single time we encounter a new type or when we go up one layer on the z-axis
			if(
				(type != rememberedType && rememberedType != -1)
				|| i % max2dIndex == 0
			) {
				// only do optimizations for counts at or higher than 4 for max efficency
				if(rememberedTypeCount >= 4) {
					file.writeInt16(StageSaveFile.REPEAT_TILE)
					file.writeInt16(rememberedTypeCount)
					file.writeInt16(rememberedType)
				}
				else {
					for(let j = 0; j < rememberedTypeCount; j++) {
						file.writeInt16(rememberedType)
					}
				}

				rememberedTypeCount = 0
				rememberedType = -1
			}

			rememberedType = type
			rememberedTypeCount++
		}

		// dump remaining stuff at the end
		if(rememberedTypeCount >= 4) {
			file.writeInt16(StageSaveFile.REPEAT_TILE)
			file.writeInt16(rememberedTypeCount)
			file.writeInt16(rememberedType)
		}
		else {
			for(let j = 0; j < rememberedTypeCount; j++) {
				file.writeInt16(rememberedType)
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

		let version = file.readInt16()
		if(version != StageSaveFile.VERSION) {
			throw new Error(`Incorrect stage save file version, file provided v${version} but expected v${StageSaveFile.VERSION}`)
		}

		let maxX = file.readByte()
		let maxY = file.readByte()
		let maxZ = file.readByte()

		let placeTile = (position, type) => {
			if(type != StageSaveFile.BLANK_TILE) {
				this.createTile(position, type)
			}
		}

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
			// handle special commands first
			if(type == StageSaveFile.REPEAT_TILE) {
				let count = file.readInt16()
				let type = file.readInt16()

				// place all the repeated tiles we found
				for(let j = 0; j < count; j++) {
					let position = Vector3d.getTempVector(97).set(
						i % maxX,
						Math.floor(i / maxX) % maxY,
						Math.floor(i / max2dIndex)
					)
					
					placeTile(position, type)

					i++
				}
				i--
			}
			else {
				placeTile(position, type)
			}
		}

		// read lights
		let lightCount = file.readInt16()
		let tempColor = new RGBColor(0, 0, 0)
		for(let i = 0; i < lightCount; i++) {
			new TileLight(this.game, this, new Vector3d(0, 0, 0), 0, tempColor).read(file)
		}
	}
}