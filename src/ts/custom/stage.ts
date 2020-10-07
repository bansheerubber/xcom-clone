import GameObject from "../game/gameObject";
import Vector3d from "../helpers/vector3d";
import Tile from "./tile";
import TileChunk from "./tileChunk";

export default class Stage extends GameObject {
	private chunkMap: {
		[index: number]: TileChunk
	} = {}

	
	
	public createTile(position: Vector3d): Tile {
		let chunkPosition = Vector3d.getTempVector(100).copy(position).mul(1 / TileChunk.CHUNK_SIZE).foreach(Math.floor)
		if(!this.chunkMap[chunkPosition.unique2d()]) {
			this.chunkMap[chunkPosition.unique2d()] = new TileChunk(this.game, chunkPosition)
		}

		let tile = new Tile(this.game)
		tile.setPosition(position)
		this.chunkMap[chunkPosition.unique2d()].add(tile)
		return tile
	}
}