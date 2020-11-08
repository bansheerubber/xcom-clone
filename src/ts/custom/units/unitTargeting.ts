import GameObject from "../../game/gameObject";
import Stage, { StageLayer } from "../stage";
import type Tile from "../tile";
import { TileSprites } from "../tile";
import type Unit from "./unit";

export enum UNIT_ATTACK {
	ACCURACY,
	SNAP_SHOT,
	AUTO,
}

// handles targetting and shooting and stuff
export default class UnitTargeting extends GameObject {
	private unit: Unit
	private stage: Stage
	private targets: Unit[] = []
	private _target: Unit
	private _targetIndex: number = -1
	private _range: number
	private reticleTile: Tile

	constructor(game, stage: Stage, unit: Unit) {
		super(game)

		this.unit = unit
		this.stage = stage
	}

	set range(value: number) {
		this._range = value
		this.calculateTargets()
	}

	get range(): number {
		return this._range
	}

	// figure out all the targets within our range
	public calculateTargets() {
		this.targets = []

		let distanceMap = new Map<Unit, number>()
		for(let unit of this.stage.getUnits()) {
			let distance
			if(unit.team != this.unit.team && (distance = unit.position.dist(this.unit.position)) < this.range) {
				this.targets.push(unit)
				distanceMap.set(unit, distance)
			}
		}

		this.targets = this.targets.sort((a, b) => distanceMap.get(a) - distanceMap.get(b))
	}

	private createTargetReticle() {
		this.reticleTile?.destroy()

		if(this.target) {
			this.reticleTile = this.stage.createTile(this.target.position, TileSprites.TARGET, StageLayer.DOT_LAYER)
		}
	}

	public clearTarget() {
		this._targetIndex = -1
		this._target = null
		this.createTargetReticle()
	}

	set target(unit: Unit) {
		if(this.unit.team == unit.team && this.targets.indexOf(unit) != -1) {
			this.targetIndex = this.targets.indexOf(unit)
		}
	}

	get target(): Unit {
		return this._target
	}

	set targetIndex(value: number) {
		if(this.targets.length > 0) {
			this._targetIndex = value

			if(this._targetIndex < 0) {
				this._targetIndex = this.targets.length - 1
			}
			else {
				this._targetIndex = this._targetIndex % this.targets.length
			}

			this._target = this.targets[this._targetIndex]
		}
		else {
			this._targetIndex = -1
			this._target = null
		}
		this.createTargetReticle()
	}

	get targetIndex(): number {
		return this._targetIndex
	}

	get targetCount(): number {
		return this.targets.length
	}

	public destroy() {
		super.destroy()

		this.targets = []

		delete this.unit
		delete this.stage
		delete this.targets
	}
}