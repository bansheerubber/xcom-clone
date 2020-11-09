import Vector3d from "../../helpers/vector3d"
import Gun from "../items/guns/gun"
import { StageLayer, StageRotation } from "../stage"
import Team from "../team"
import Tile from "../tile"
import UnitMovement from "./unitMovement"
import UnitTargeting from "./unitTargeting"

export default class Unit extends Tile {
	public movement: UnitMovement = new UnitMovement(this.game, this.stage, this)
	public targeting: UnitTargeting = new UnitTargeting(this.game, this.stage, this)
	public team: Team
	public baseSprite: string
	public equippedWeapon: Gun
	private _ap: number
	private _maxAP: number
	private _unit45DegreeRotation: boolean = false
	private _unitRotation: number = 1

	public refillAP() {
		this.ap = this.maxAP
	}

	set unitRotation(rotation: number) {
		this._unitRotation = rotation
		this.updateUnitRotation()
	}

	set unit45DegreeRotation(value: boolean) {
		this._unit45DegreeRotation = value
		this.updateUnitRotation()
	}

	private updateUnitRotation() {
		this.typeName = `${this.baseSprite}${this._unit45DegreeRotation ? "_r" : ""}${this._unitRotation}.png`
	}

	set ap(value: number) {
		this._ap = Math.min(Math.max(value, 0), this.maxAP)
		this.movement.calculateRange()
		this.targeting.calculateTargets()
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
		this.targeting.calculateTargets()

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

	public setUnitRotationFromPosition(position: Vector3d) {
		let angle = -Math.atan2(position.y - this.position.y, position.x - this.position.x)
		if(angle < 0) {
			angle += Math.PI * 2
		}
		let rotation = Math.round(angle / (Math.PI / 4))
		let is45Deg = rotation % 2 == 1
		if(is45Deg) {
			rotation = Math.floor((rotation - 1) / 2) % 4
		}
		else {
			rotation = Math.floor(rotation / 2)  % 4
		}
		rotation += 1
		this.unit45DegreeRotation = is45Deg
		this.unitRotation = rotation
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