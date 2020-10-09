import GameObjectOptions from "../game/gameObjectOptions";
import Vector3d from "../helpers/vector3d";
import Stage from "./stage";
import Tile from "./tile";
import { TileChunkUpdate } from "./tileChunk";

export default class GhostTile extends Tile {
	private opacityDirection: number = -1
	private outlines: Set<Tile> = new Set()
	
	
	
	constructor(game, stage: Stage, spriteIndex: number = 13, layer: number = 0, optionsOverride: GameObjectOptions) {
		super(game, stage, spriteIndex, layer, {
			canTick: true
		})
	}

	setPosition(position: Vector3d) {
		super.setPosition(position)

		for(let outline of this.outlines) {
			outline.destroy()
		}

		this.outlines.clear()

		for(let z = 0; z <= this.getPosition().z; z++) {
			this.outlines.add(this.stage.createTile(Vector3d.getTempVector(98).set(this.getPosition().x, this.getPosition().y, z), 268, 11))
		}
	}

	tick(deltaTime: number) {
		super.tick(deltaTime)
		
		if(this.opacity >= 0.8) {
			this.opacityDirection = -1
		}
		else if(this.opacity <= 0.4) {
			this.opacityDirection = 1
		}

		this.opacity += this.opacityDirection * deltaTime

		this.chunk.update(TileChunkUpdate.NO_LIGHTS)
	}
}