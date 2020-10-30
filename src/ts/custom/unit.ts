import { StageLayer, StageRotation } from "./stage";
import Tile from "./tile";

export default class Unit extends Tile {
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
	
	public destroy() {
		super.destroy()

		this.stage?.removeUnit(this)
	}
}