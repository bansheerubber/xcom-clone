import GameObject from "../../game/gameObject";
import Item from "./item";

export default class Inventory extends GameObject {
	private items: Set<Item> = new Set()
	
	constructor(game) {
		super(game, {
			canTick: false,
		})
	}

	public add(item: Item) {
		this.items.add(item)
		item.owner = this
	}

	public remove(item: Item) {
		this.items.delete(item)
	}
}