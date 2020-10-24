import * as React from "react";
import * as ReactDOM from "react-dom";
import Game from "../game/game";
import Vector3d from "../helpers/vector3d";
import ImageResource from "../render/imageResource";
import ControllableCamera from "./controllableCamera";
import Stage from "./stage";
import GeoscapeScene from "./ui/geoscape/geoscapeScene";
import MainUI from "./ui/main";
import GeoscapeCountry from "./ui/geoscape/geoscapeCountry";
import SaveFile from "./saveFile";
import { generalNamePicker } from "./ui/datacuses/generalNamePicker";
import { commissionNamePicker } from "./ui/datacuses/commissionNamePicker";

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
				let saveFile = new SaveFile(game)
				// let sprite1 = new GeoscapeIcon(game, geoscape, "./data/base.png")
				// sprite1.longitude = -113.674718
				// sprite1.latitude = 38.272689

				// let sprite2 = new GeoscapeIcon(game, geoscape)
				// sprite2.longitude = 45
				// sprite2.latitude = 45

				new GeoscapeCountry(game, geoscape, "./data/countries/north america.json")
				new GeoscapeCountry(game, geoscape, "./data/countries/central america.json")
				new GeoscapeCountry(game, geoscape, "./data/countries/south america.json")
		
				new GeoscapeCountry(game, geoscape, "./data/countries/ussr.json")
				new GeoscapeCountry(game, geoscape, "./data/countries/europe.json")
				new GeoscapeCountry(game, geoscape, "./data/countries/asia.json")
				new GeoscapeCountry(game, geoscape, "./data/countries/africa.json")
				new GeoscapeCountry(game, geoscape, "./data/countries/oceania.json")
				new GeoscapeCountry(game, geoscape, "./data/countries/middle east.json")

				ReactDOM.render(<MainUI game={game} geoscapeScene={geoscape} stage={stage} />, document.getElementById("reactContainer"))

				setTimeout(() => {
					geoscape.displayDatacus("Choose Commission Name", commissionNamePicker(geoscape, saveFile), true)
				}, 5000)
			})
			game.renderer.camera = new ControllableCamera(game)
		})
	}
}