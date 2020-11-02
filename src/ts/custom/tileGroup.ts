import GameObject from "../game/gameObject";
import { RGBColor } from "../helpers/color";
import Stage, { StageLayer } from "./stage";
import Tile, { TileSprites } from "./tile";

export default class TileGroup extends GameObject {
	private tiles: Set<Tile> = new Set()
	private tileOutlines: Set<Tile> = new Set()
	private stage: Stage
	private _color: RGBColor

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

	public clear() {
		this.tiles.clear()
		this.clearOutline()
	}
	
	public has(tile: Tile): boolean {
		return this.tiles.has(tile)
	}

	/**
	 * draws an outline around our tile group
	 */
	public drawOutline() {
		this.clearOutline()

		const outlines = [
			TileSprites.OUTLINE_NORTH,
			TileSprites.OUTLINE_EAST,
			TileSprites.OUTLINE_SOUTH,
			TileSprites.OUTLINE_WEST,
		]
		
		// iterate through the enum
		for(let tile of this.tiles.values()) {
			for(let i = 0; i < 4; i++) {
				let adjacent = tile.getAdjacent(i)
				// if we find an adjacent tile that we need to draw a border along, then do it
				if(!adjacent || !this.tiles.has(adjacent)) {
					let outline = this.stage.createTile(tile.position, outlines[i], StageLayer.OUTLINE_LAYER1 + i)
					outline.tint = this.color
					this.tileOutlines.add(outline)
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

	set color(color: RGBColor) {
		this._color = color
		for(let tile of this.tileOutlines) {
			tile.tint = color
		}
	}

	get color(): RGBColor {
		return this._color
	}
}