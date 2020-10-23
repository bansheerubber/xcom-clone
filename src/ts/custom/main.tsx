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
import GeoscapeBorder from "./ui/geoscape/geoscapeBorder";
import GeoscapeScene from "./ui/geoscape/geoscapeScene";
import MainUI from "./ui/main";
import { Keybind } from "../game/keybinds";
import GeoscapeCountry from "./ui/geoscape/geoscapeCountry";
import GeoscapeDialog from "./ui/geoscape/geoscapeDialog";
import { Scene } from "three";

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
					/*geoscape.displayDialog(
						"Alert: Datacus Message",
						"Welcome to the Terracourium, %t% %ln%. This globe is the latest technology avaliable to us. You can spin it any which way you want, and it also has a ton of lines drawn on it. If we detect any UFO activity, you'll be able to see it here. Our bases will also be marked on here once we get them built. Go ahead, give the great big ball a whirl.",
						[
							["Thank you", () => { geoscape.closeDialog() }],
						],
					)*/

					geoscape.displayDatacus(
						"Choose Your Name",
						<div>
							<div className="text">
								I'm sorry, despite you being a very well known general I'm afraid I never got your name. Please enter it into our system below:
								<br />
								<br />
								<div className="form">
									<label htmlFor="first-name">First Name:</label>
									<input id="first-name" type="text" />
								</div>

								<div className="form">
									<label htmlFor="last-name">Last Name:</label>
									<input id="last-name" type="text" />
								</div>

								<div className="form">
								<label htmlFor="prefix">Prefix:</label>
									<select id="prefix">
										<option value="none">None</option>
										<option value="Mr.">Mr.</option>
										<option value="Ms.">Ms.</option>
										<option value="Mrs.">Mrs.</option>
										<option value="Dr.">Dr.</option>
										<option value="Sr.">Sr.</option>
										<option value="Jr.">Jr.</option>
									</select>
								</div>
							</div>
							<div className="dialog-buttons-container">
								<button onClick={() => geoscape.closeDatacus()}>{"<Done>"}</button>
							</div>
						</div>,
						true
					)
				}, 5000)
			})
			game.renderer.camera = new ControllableCamera(game)
		})
	}
}