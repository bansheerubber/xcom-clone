import { Vector } from "matter-js";
import * as React from "react";
import * as ReactDOM from "react-dom";
import Game from "../game/game";
import {
	RGBColor
} from "../helpers/color";
import Vector3d from "../helpers/vector3d";
import ImageResource from "../render/imageResource";
import ControllableCamera from "./controllableCamera";
import Stage from "./stage";
import TileLight from "./tileLight";
import TileRaycast from "./tileRaycast";
import GeoscapeIcon from "./ui/geoscape/geoscapeIcon";
import GeoscapeScene from "./ui/geoscape/geoscapeScene";
import MainUI from "./ui/main";

export default async function(game: Game) {
	if(game.isClient) {
		ImageResource.queueImage("./data/sprites/spritesheet test.json")
		.queueImage("./data/egg.png")
		.loadImages().then(() => {
			console.log("loaded images")
			
			let stage = new Stage(game);
			stage.load("./data/stage.egg").then(() => {
				stage.createTile(new Vector3d(15, 5, 3), 83)

				let geoscape = new GeoscapeScene(game)
				let sprite1 = new GeoscapeIcon(game, geoscape)
				sprite1.longitude = -113.674718
				sprite1.latitude = 38.272689

				let sprite2 = new GeoscapeIcon(game, geoscape)
				sprite2.longitude = 45
				sprite2.latitude = 45

				ReactDOM.render(<MainUI game={game} geoscapeScene={geoscape} stage={stage} />, document.getElementById("reactContainer"))
			})

			game.renderer.camera = new ControllableCamera(game)
		})
	}
}