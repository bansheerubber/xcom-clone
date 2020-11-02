import GameObjectOptions from "../game/gameObjectOptions";
import Vector3d from "../helpers/vector3d";
import Stage, { StageLayer } from "./stage";
import Tile, { TileSprites } from "./tile";

export default class GhostTile extends Tile {
	private opacityDirection: number = -1
	private outlines: Set<Tile> = new Set()
	
	constructor(game, stage: Stage, spriteIndex: number | string = TileSprites.DEFAULT_TILE, layer: number = StageLayer.DEV_GHOST_LAYER, optionsOverride: GameObjectOptions) {
		super(game, stage, spriteIndex, layer, {
			canTick: true
		})
	}

	set position(position: Vector3d) {
		super.position = position

		for(let outline of this.outlines) {
			outline.destroy()
		}

		this.outlines.clear()

		for(let z = 0; z <= this.position.z; z++) {
			this.outlines.add(this.stage.createTile(
				Vector3d.getTempVector(98).set(this.position.x, this.position.y, z),
				TileSprites.GHOST_INDEX,
				StageLayer.DEV_GHOST_BOX_LAYER
			))
		}
	}

	get position(): Vector3d {
		return super.position
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

		this.chunk.update(this)
	}
}