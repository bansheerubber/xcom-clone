import GameObject from "../../game/gameObject";
import { RGBColor } from "../../helpers/color";
import Stage from "../stage";
import Tile from "../tile";
import TileGroup from "../tileGroup";
import Unit from "./unit";

export default class UnitMovement extends GameObject {
	public unit: Unit
	/**
	 * the amount of moves the unit can travel
	 */
	private _moves: number = 0
	private stage: Stage
	private range: TileGroup
	private moveScoreMap: Map<Tile, number> = new Map()
	
	constructor(game, stage: Stage, unit: Unit) {
		super(game, {
			canTick: false,
		})

		this.unit = unit
		this.stage = stage
		this.range = new TileGroup(this.game, this.stage)
		this.range.color = new RGBColor(0, 0.7, 1)
	}

	/**
	 * get the set of tiles the unit can move to
	 */
	public calculateRange(): TileGroup {
		this.range.clear()
		this.moveScoreMap.clear()
		this.isInRange(this.unit.tile, this.moves)
		return this.range
	}

	public showMoves() {
		this.range.drawOutline()
	}

	set moves(moves: number) {
		this._moves = moves
		this.calculateRange()
	}

	get moves(): number {
		return this._moves
	}

	private isInRange(tile: Tile, moves: number) {
		if(
			moves > 0
			&& (this.moveScoreMap.get(tile) == undefined || this.moveScoreMap.get(tile) < moves)
			&& (!tile.getTop() || tile.getTop().isWall)
		) {
			this.range.add(tile)
			this.moveScoreMap.set(tile, moves)

			if(!tile.getTop()?.isWall) {
				for(let adjacent of tile.getAdjacents()) {
					this.isInRange(adjacent, moves - 1)
				}
	
				for(let diagonal of tile.getDiagonals()) {
					this.isInRange(diagonal, moves - 1)
				}	
			}
		}
	}
}