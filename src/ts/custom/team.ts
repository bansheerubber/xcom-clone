import GameObject from "../game/gameObject"
import Unit from "./units/unit"

export default class Team extends GameObject {
	public units: Set<Unit> = new Set
	
	constructor(game) {
		super(game, {
			canTick: false,
		})
	}
}