import GameObject from "../game/gameObject";
import Stage from "./stage";
import Tile from "./tile";

export default class TileGroup extends GameObject {
	private tiles: Set<Tile> = new Set()
	private tileOutlines: Set<Tile> = new Set()
	private stage: Stage



	constructor(game, stage: Stage) {
		super(game)
		this.stage = stage
	}

	public add(tile: Tile) {
		this.tiles.add(tile)

		// keep updating the outlines as we add tiles
		if(this.tileOutlines.size > 0) {
			this.drawOutline()
		}
	}

	public remove(tile: Tile) {
		this.tiles.delete(tile)

		// keep updating the outlines as we remove tiles
		if(this.tileOutlines.size > 0) {
			this.drawOutline()
		}
	}

	/**
	 * draws an outline around our tile group
	 */
	public drawOutline() {
		this.clearOutline()
		
		// iterate through the enum
		for(let tile of this.tiles.values()) {
			for(let i = 0; i < 4; i++) {
				let adjacent = tile.getAdjacent(i)
				// if we find an adjacent tile that we need to draw a border along, then do it
				if(!adjacent || !this.tiles.has(adjacent)) {
					this.tileOutlines.add(this.stage.createTile(tile.position, 274 + i, 1))
				}
			}
		}
	}

	/**
	 * clear a previously drawn outline
	 */
	public clearOutline() {
		for(let tile of this.tileOutlines.values()) {
			tile.destroy()
		}
		this.tileOutlines = new Set()
	}
}