import Collidable from "./collidable";
import Game from "../game/game";
import Matter = require("matter-js");
import Vector from "../helpers/vector";

export default class CollidableBox extends Collidable {
	constructor(game: Game, position: Vector, width: number, height: number) {
		super(game)

		this.body = Matter.Bodies.rectangle(position.x, position.y, width, height)
		this.game.collision.add(this)
	}

	public tick(deltaTime: number): void {

	}
}