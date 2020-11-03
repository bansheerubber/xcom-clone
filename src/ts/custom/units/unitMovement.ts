import GameObject from "../../game/gameObject";
import { RGBColor } from "../../helpers/color";
import Vector3d from "../../helpers/vector3d";
import Stage from "../stage";
import Tile from "../tile";
import TileGroup from "../tileGroup";
import Unit from "./unit";

type Vector3dUnique = number

export default class UnitMovement extends GameObject {
	public unit: Unit
	/**
	 * the amount of moves the unit can travel
	 */
	private _moves: number = 0
	private stage: Stage
	private range: TileGroup
	private rangePositions: Set<Vector3d> = new Set()
	private rangePositionsUnique: Set<Vector3dUnique> = new Set()
	private tempPath: TileGroup
	private moveScoreMap: Map<Vector3dUnique, number> = new Map()
	private startPath: Vector3dUnique = -1
	private endPath: Vector3dUnique = -1
	private movesShown: boolean = false
	
	constructor(game, stage: Stage, unit: Unit) {
		super(game, {
			canTick: false,
		})

		this.unit = unit
		this.stage = stage
		this.range = new TileGroup(this.game, this.stage)
		this.range.color = new RGBColor(0, 0.7, 1)
		this.tempPath = new TileGroup(this.game, this.stage)
		this.tempPath.color = new RGBColor(0, 1, 0)
	}

	/**
	 * get the set of tiles the unit can move to
	 */
	public calculateRange(): TileGroup {
		this.range.clear()
		this.moveScoreMap.clear()
		this.rangePositions.clear()
		this.rangePositionsUnique.clear()

		this.isInRange(this.unit.position.clone(), Math.floor(this.unit.ap + 1))

		if(this.rangePositions.size > 1) {
			for(let position of this.rangePositions) {
				this.range.add(this.stage.getMapTile(position.$add(0, 0, -1)))
			}
	
			if(this.movesShown) {
				this.showMoves()
			}
		}
		else {
			this.range.clear()
			this.moveScoreMap.clear()
			this.rangePositions.clear()
			this.rangePositionsUnique.clear()
		}

		return this.range
	}

	public showMoves() {
		this.range.drawOutline()
		this.movesShown = true
	}

	public hideMoves() {
		this.range.clearOutline()
		this.range.clearDots()
		this.movesShown = false
	}

	public showPath(goal: Vector3d) {
		if(this.startPath != this.unit.position.unique() || this.endPath != goal.unique()) {
			let positions = this.stage.pathfind(this.unit.position, goal, this.rangePositionsUnique)
			this.tempPath.clear()
			if(positions) {
				for(let position of positions) {
					let tile = this.stage.getMapTile(position.$add(0, 0, -1))
					this.tempPath.add(tile)
				}
				this.tempPath.drawDots()

				this.startPath = this.unit.position.unique()
				this.endPath = goal.unique()
			}
			else {
				this.startPath = -1
				this.endPath = -1
			}
		}
	}

	public clearPath() {
		this.tempPath.clearDots()
		this.tempPath.clear()
	}

	public move(position: Vector3d) {
		if(this.rangePositionsUnique.has(position.unique())) {
			this.unit.ap -= this.unit.ap - (this.moveScoreMap.get(position.unique()) - 1)
			this.unit.position = position
		}
	}

	set moves(moves: number) {
		this._moves = moves
		this.calculateRange()
	}

	get moves(): number {
		return this._moves
	}

	private isInRange(position: Vector3d, moves: number) {
		if(
			moves > 0
			&& (this.moveScoreMap.get(position.unique()) == undefined || this.moveScoreMap.get(position.unique()) < moves)
		) {
			this.rangePositions.add(position)
			this.rangePositionsUnique.add(position.unique())
			this.moveScoreMap.set(position.unique(), moves)

			for(let adjacent of this.stage.getPathfindingNeighbors(position)) {
				this.isInRange(adjacent, moves - position.dist(adjacent))
			}
		}
	}

	public destroy() {
		super.destroy()

		this.tempPath?.destroy()
		this.range?.destroy()
	}
}