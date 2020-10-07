import GameObject from "../game/gameObject";
import Vector from "../helpers/vector";
import Vector3d from "../helpers/vector3d";
import Tile from "./tile";
import TileChunk from "./tileChunk";

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

	private selectedTile: Tile
	private selectedTileOutline: Tile

	
	
	public createTile(position: Vector3d, spriteIndex: number = 13, layer: number = 0): Tile {
		let chunkPosition = Vector3d.getTempVector(100).copy(position).mul(1 / TileChunk.CHUNK_SIZE).foreach(Math.floor)
		if(!this.chunkMap[chunkPosition.unique2d()]) {
			this.chunkMap[chunkPosition.unique2d()] = new TileChunk(this.game, chunkPosition)
		}

		if(!this.tileMap[layer]) {
			this.tileMap[layer] = {}
		}

		let tile = new Tile(this.game, this, spriteIndex, layer)
		tile.setPosition(position.clone())
		this.tileMap[layer][position.unique()] = tile
		this.chunkMap[chunkPosition.unique2d()].add(tile)
		return tile
	}

	public selectTile(tile: Tile) {
		if(this.selectedTile) {
			this.selectedTile.unselect()
			this.selectedTile = null
			this.selectedTileOutline.destroy()
		}

		this.selectedTile = tile

		if(this.selectedTile) {
			this.selectedTile.select()
			this.selectedTileOutline = this.createTile(this.selectedTile.getPosition(), 286, 1)
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

		if(this.tileMap[0][index]) {
			return this.tileMap[0][index]
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
}