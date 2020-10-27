import * as PIXI from "pixi.js";
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
import GeoscapeIncident from "./ui/geoscape/geoscapeIncident";
import XCOMGamemode from "./xcomGamemode";

export default async function(game: Game) {
	if(game.isClient) {
		ImageResource.queueImage("./data/sprites/spritesheet.json")
		.queueImage("./data/egg.png")
		.loadImages().then(() => {	
			console.log("loaded images")
			game.gamemode = new XCOMGamemode(game)
		})
	}
}