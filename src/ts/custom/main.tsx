import { count } from "console";
import Game from "../game/game";
import { RGBColor } from "../helpers/color";
import Range from "../helpers/range";
import Vector from "../helpers/vector";
import Vector3d from "../helpers/vector3d";
import ImageResource from "../render/imageResource";
import Sprite from "../render/sprite";
import SpriteSheet from "../render/spriteSheet";
import ControllableCamera from "./controllableCamera";
import Stage from "./stage";
import Tile from "./tile";
import TileChunk from "./tileChunk";

export default async function(game: Game) {
	if(game.isClient) {
		ImageResource.queueImage("./data/sprites/spritesheet test.json")
		.queueImage("./data/egg.png")
		.loadImages().then(() => {
			console.log("loaded images")
			
			let stage = new Stage(game)

			let max = 149
			for(let x = 0; x <= max; x++) {
				for(let y = 0; y <= max; y++) {
					for(let z = 0; z <= 1; z++) {
						stage.createTile(Vector3d.getTempVector(0).set(x, y, z))
					}
				}
			}

			game.renderer.camera = new ControllableCamera(game)
		})
	}
}