import * as React from "react";
import * as ReactDOM from "react-dom";
import Game from "../game/game";
import {
	RGBColor
} from "../helpers/color";
import Vector from "../helpers/vector";
import Vector3d from "../helpers/vector3d";
import WebFileReader from "../helpers/webFileReader";
import ImageResource from "../render/imageResource";
import ControllableCamera from "./controllableCamera";
import Stage from "./stage";
import TileLight from "./tileLight";
import TileRaycast from "./tileRaycast";
import GeoscapeIcon from "./ui/geoscape/geoscapeIcon";
import GeoscapeLine from "./ui/geoscape/geoscapeLine";
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
				let sprite1 = new GeoscapeIcon(game, geoscape, "./data/base.png")
				sprite1.longitude = -113.674718
				sprite1.latitude = 38.272689

				new GeoscapeLine(game, geoscape, [
					new Vector(0, Math.PI / 2),
					new Vector(0, 0),
					new Vector(Math.PI / 2, Math.PI / 2),
					new Vector(0, Math.PI / 2),
				])

				new WebFileReader("./data/nz_small.json").readFile().then((json: string) => {
					let array = JSON.parse(json)
					let output = []
					for(let element of array) {
						output.push(GeoscapeScene.longLatToSpherical(element[0], element[1]))
					}
					new GeoscapeLine(game, geoscape, output)
				})

				new WebFileReader("./data/nz_small2.json").readFile().then((json: string) => {
					let array = JSON.parse(json)
					let output = []
					for(let element of array) {
						output.push(GeoscapeScene.longLatToSpherical(element[0], element[1]))
					}
					new GeoscapeLine(game, geoscape, output)
				})

				// let sprite2 = new GeoscapeIcon(game, geoscape)
				// sprite2.longitude = 45
				// sprite2.latitude = 45

				ReactDOM.render(<MainUI game={game} geoscapeScene={geoscape} stage={stage} />, document.getElementById("reactContainer"))
			})

			game.renderer.camera = new ControllableCamera(game)
		})
	}
}