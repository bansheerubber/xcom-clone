import * as React from "react";
import * as ReactDOM from "react-dom";
import Game from "../game/game";
import {
	Keybind,
	KeybindModifier
} from "../game/keybinds";
import {
	RGBColor
} from "../helpers/color";
import Vector3d from "../helpers/vector3d";
import ImageResource from "../render/imageResource";
import ControllableCamera from "./controllableCamera";
import GhostTile from "./ghostTile";
import Stage from "./stage";
import MainUI from "./ui/main";

export default async function(game: Game) {
	if(game.isClient) {
		ImageResource.queueImage("./data/sprites/spritesheet test.json")
		.queueImage("./data/egg.png")
		.loadImages().then(() => {
			console.log("loaded images")
			
			let stage = new Stage(game)
			stage.load("./data/stage.egg")

			game.renderer.camera = new ControllableCamera(game)

			ReactDOM.render(<MainUI game={game} stage={stage} />, document.getElementById("reactContainer"))
		})
	}
}