import { runInThisContext } from "vm";
import GameObject from "../game/gameObject";
import { RGBColor } from "../helpers/color";
import Stage, { StageLayer } from "./stage";
import Tile, { TileSprites, TILE_ADJACENT } from "./tile";

export default class TileGroup extends GameObject {
	private tiles: Set<Tile> = new Set()
	private tileOutlines: Set<Tile> = new Set()
	private tileDots: Set<Tile> = new Set()
	private stage: Stage
	private _color: RGBColor

	constructor(game, stage: Stage, tiles?: IterableIterator<Tile> | Tile[]) {
		super(game)
		this.stage = stage

		if(tiles) {
			for(let tile of tiles) {
				this.add(tile)
			}
		}
	}

	public set(tiles: IterableIterator<Tile> | Tile[]) {
		this.clear()
		for(let tile of tiles) {
			this.add(tile)
		}
	}

	public add(tile: Tile) {
		this.tiles.add(tile)

		// keep updating the outlines as we add tiles
		if(this.tileOutlines.size > 0) {
			this.drawOutline()
		}

		// keep updating the dots as we remove tiles
		if(this.tileDots.size > 0) {
			this.drawDots()
		}
	}

	public remove(tile: Tile) {
		this.tiles.delete(tile)

		// keep updating the outlines as we remove tiles
		if(this.tileOutlines.size > 0) {
			this.drawOutline()
		}

		// keep updating the dots as we remove tiles
		if(this.tileDots.size > 0) {
			this.drawDots()
		}
	}

	public clear() {
		this.tiles.clear()
		this.clearOutline()
	}
	
	public has(tile: Tile): boolean {
		return this.tiles.has(tile)
	}
	
	public size(): number {
		return this.tiles.size
	}

	public allTiles(): IterableIterator<Tile> {
		return this.tiles.values()
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

		const rotationToOutline = {
			1: TileSprites.OUTLINE_SOUTH,
			2: TileSprites.OUTLINE_EAST,
			3: TileSprites.OUTLINE_NORTH,
			4: TileSprites.OUTLINE_WEST,
		}

		const cornerToOutline = {
			1: [TileSprites.OUTLINE_SOUTH, TileSprites.OUTLINE_EAST],
			2: [TileSprites.OUTLINE_NORTH, TileSprites.OUTLINE_EAST],
			3: [TileSprites.OUTLINE_NORTH, TileSprites.OUTLINE_WEST],
			4: [TileSprites.OUTLINE_SOUTH, TileSprites.OUTLINE_WEST],
		}

		const rotationToDirection = {
			1: TILE_ADJACENT.NORTH,
			2: TILE_ADJACENT.WEST,
			3: TILE_ADJACENT.SOUTH,
			4: TILE_ADJACENT.EAST,
		}

		const cornerToDirection = {
			1: [TILE_ADJACENT.NORTH, TILE_ADJACENT.WEST],
			2: [TILE_ADJACENT.SOUTH, TILE_ADJACENT.WEST],
			3: [TILE_ADJACENT.SOUTH, TILE_ADJACENT.EAST],
			4: [TILE_ADJACENT.NORTH, TILE_ADJACENT.EAST],
		}
		
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

				if(tile.getTop() && tile.getTop().isWall) {
					if(tile.getTop().isWallCorner) {
						for(let i = 0; i < cornerToDirection[tile.getTop().rotation].length; i++) {
							let direction = cornerToDirection[tile.getTop().rotation][i]
							let adjacent = tile.getAdjacent(direction)
							if(adjacent && this.tiles.has(adjacent)) {
								let index = outlines.indexOf(cornerToOutline[tile.getTop().rotation][i])
								let outline = this.stage.createTile(adjacent.position, cornerToOutline[tile.getTop().rotation][i], StageLayer.OUTLINE_LAYER1 + index)
								outline.tint = this.color
								this.tileOutlines.add(outline)
							}
						}
					}
					else {
						let adjacent = tile.getAdjacent(rotationToDirection[tile.getTop().rotation])
						if(adjacent && this.tiles.has(adjacent)) {
							let index = outlines.indexOf(rotationToOutline[tile.getTop().rotation])
							let outline = this.stage.createTile(adjacent.position, rotationToOutline[tile.getTop().rotation], StageLayer.OUTLINE_LAYER1 + index)
							outline.tint = this.color
							this.tileOutlines.add(outline)
						}
					}
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

	/**
	 * draw dots on every single tile
	 */
	public drawDots() {
		this.clearDots()
		
		// iterate through the enum
		for(let tile of this.tiles.values()) {
			let dot = this.stage.createTile(tile.position, TileSprites.DOT, StageLayer.DOT_LAYER)
			dot.tint = this.color
			this.tileOutlines.add(dot)
		}
	}

	/**
	 * clear previously drawn dots
	 */
	public clearDots() {
		for(let tile of this.tileDots.values()) {
			tile.destroy()
		}
		this.tileDots = new Set()
	}

	set color(color: RGBColor) {
		this._color = color
		for(let tile of this.tileOutlines) {
			tile.tint = color
		}

		this._color = color
		for(let tile of this.tileDots) {
			tile.tint = color
		}
	}

	get color(): RGBColor {
		return this._color
	}
}