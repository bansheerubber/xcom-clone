import Vector3d from "../../helpers/vector3d"
import { StageLayer, StageRotation } from "../stage"
import Team from "../team"
import Tile from "../tile"
import UnitMovement from "./unitMovement"

export default class Unit extends Tile {
	public movement: UnitMovement = new UnitMovement(this.game, this.stage, this)
	public team: Team
	private _ap: number
	private _maxAP: number

	public refillAP() {
		this.ap = this.maxAP
	}

	set ap(value: number) {
		this._ap = Math.min(Math.max(value, 0), this.maxAP)
		this.movement.calculateRange()
	}

	get ap(): number {
		return this._ap
	}

	set maxAP(value: number) {
		this._maxAP = value
		this.ap = value
	}

	get maxAP(): number {
		return this._maxAP
	}

	set position(position: Vector3d) {
		super.position = position
		this.movement.calculateRange()

		if(this == this.stage.selectedUnit) {
			this.stage.selectUnit(this)
		}
	}

	get position(): Vector3d {
		return this._position
	}

	public select() {
		this.movement.showMoves()
	}

	public unselect() {
		this.movement.clearPath()
		this.movement.hideMoves()
	}

	protected updateSpritePosition() {
		super.updateSpritePosition()

		let xZIndex, yZIndex
		switch(this.stage.rotation) {
			case StageRotation.DEG_0: {
				xZIndex = 1
				yZIndex = 1
				break
			}

			case StageRotation.DEG_90: {
				xZIndex = 1
				yZIndex = -1
				break
			}

			case StageRotation.DEG_180: {
				xZIndex = -1
				yZIndex = -1
				break
			}

			case StageRotation.DEG_270: {
				xZIndex = -1
				yZIndex = 1
				break
			}
		}

		this.sprite.zIndex = -this.position.x * xZIndex + this.position.y * yZIndex + this.position.z + StageLayer.DEFAULT_LAYER / Tile.TILE_LAYER_RESOLUTION + (1 / Tile.TILE_LAYER_RESOLUTION) / 3
	}

	/**
	 * the tile the unit is standing on
	 */
	get tile(): Tile {
		return this.stage.getMapTile(Vector3d.getTempVector(42).set(this.position.x, this.position.y, this.position.z - 1))
	}
	
	public destroy() {
		super.destroy()

		this.stage?.removeUnit(this)
		this.movement?.destroy()
		delete this.team
		delete this.movement
	}
}