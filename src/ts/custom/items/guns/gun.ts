import Unit from "../../units/unit";
import Item from "../item";

export enum SHOT_TYPE {
	ACCURATE,
	SNAPSHOT,
	AUTO,
}

export const SHOT_UI_NAME = {
	[SHOT_TYPE.ACCURATE]: "Accurate Shot",
	[SHOT_TYPE.SNAPSHOT]: "Snapshot",
	[SHOT_TYPE.AUTO]: "3 Automatic Shots",
}

export default class Gun extends Item {
	public isAuto: boolean = false
	public accuracies: Partial<{ [key in SHOT_TYPE]: number }>
	public aps: Partial<{ [key in SHOT_TYPE]: number }>
	public missRadius: number
	public unit: Unit

	constructor(game, unit: Unit) {
		super(game)
		this.unit = unit
	}

	public getAccuracy(index: SHOT_TYPE): number {
		if(this.unit.targeting.target) {
			return Math.max(0, Math.min(1, this.accuracies[index] - this.unit.targeting.target.position.dist(this.unit.position) * 0.005))
		}
		else {
			return 0
		}
	}
}