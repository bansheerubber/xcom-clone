import * as PIXI from "pixi.js"
import Game from "../game/game";
import { Keybind, KeybindModifier } from "../game/keybinds";
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
import TileGroup from "./tileGroup";

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
					let count = 0
					for(let z = 0; z <= count; z++) {
						let color = new RGBColor(1, 1, 1)
						if(x % 2 == y % 2) {
							color = new RGBColor(0.8, 0.8, 0.8)
						}
						
						stage.createTile(Vector3d.getTempVector(0).set(x, y, z)).sprite.tint = color
					}
				}
			}

			game.renderer.camera = new ControllableCamera(game)

			new Keybind("mouse0", KeybindModifier.NONE, "Select Tile").down((event: MouseEvent) => {
				stage.selectTileUnderMouse(event.x, event.y)
			})
		})
	}
}