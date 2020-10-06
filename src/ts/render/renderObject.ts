import GameObject from "../game/gameObject";
import { gameClass } from "../network/networkDecorators";
import Game from "../game/game";
import GameObjectOptions from "../game/gameObjectOptions";

export default abstract class RenderObject extends GameObject {
	constructor(game: Game, gameObjectOptions?: GameObjectOptions) {
		super(game, gameObjectOptions)
		this.game.renderer.addObject(this)
	}

	public destroy(): void {
		super.destroy()
		this.game.renderer.removeObject(this)
	}
}