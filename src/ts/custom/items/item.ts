import GameObject from "../../game/gameObject";
import Inventory from "./inventory";

export default class Item extends GameObject {
	public owner: Inventory
	public name: string
	public description: string
	
	constructor(game) {
		super(game, {
			canTick: false,
		})
	}
}