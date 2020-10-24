import * as React from "react";
import * as ReactDOM from "react-dom";
import Gamemode from "../game/gamemode";
import ControllableCamera from "./controllableCamera";
import Stage from "./stage";
import { commissionNamePicker } from "./ui/datacuses/commissionNamePicker";
import GeoscapeCountry from "./ui/geoscape/geoscapeCountry";
import GeoscapeIncident from "./ui/geoscape/geoscapeIncident";
import GeoscapeScene from "./ui/geoscape/geoscapeScene";
import MainUI from "./ui/main";

export default class XCOMGamemode extends Gamemode {
	public stage: Stage
	public geoscape: GeoscapeScene
	public mainUI: MainUI

	constructor(game) {
		super(game)

		this.geoscape = new GeoscapeScene(game)
		let sprite1 = new GeoscapeIncident(game, this.geoscape)
		sprite1.longitude = -113.674718
		sprite1.latitude = 38.272689

		new GeoscapeCountry(game, this.geoscape, "./data/countries/north america.json")
		new GeoscapeCountry(game, this.geoscape, "./data/countries/central america.json")
		new GeoscapeCountry(game, this.geoscape, "./data/countries/south america.json")

		new GeoscapeCountry(game, this.geoscape, "./data/countries/ussr.json")
		new GeoscapeCountry(game, this.geoscape, "./data/countries/europe.json")
		new GeoscapeCountry(game, this.geoscape, "./data/countries/asia.json")
		new GeoscapeCountry(game, this.geoscape, "./data/countries/africa.json")
		new GeoscapeCountry(game, this.geoscape, "./data/countries/oceania.json")
		new GeoscapeCountry(game, this.geoscape, "./data/countries/middle east.json")

		this.mainUI = ReactDOM.render(<MainUI game={game} geoscapeScene={this.geoscape} />, document.getElementById("reactContainer")) as any as MainUI

		this.focusGeoscape()
		game.renderer.camera = new ControllableCamera(game, null)

		/*setTimeout(() => {
			this.geoscape.displayDatacus("Choose Commission Name", commissionNamePicker(this.geoscape), true)
		}, 1000)*/
	}
	
	public loadStage(filename: string) {
		this.stage?.destroy()
		this.stage = new Stage(this.game)
		this.stage.load(filename).then(() => {
			this.focusStage()
		})
	}

	public focusGeoscape() {
		this.game.renderer.stop()
		this.geoscape.start()

		this.mainUI.setState({
			displayGeoscape: true
		})
	}

	public focusStage() {
		if(this.stage) {
			(this.game.renderer.camera as ControllableCamera).stage = this.stage
			
			this.game.renderer.start()
			this.geoscape.stop()

			this.mainUI.setState({
				displayGeoscape: false
			})
		}
	}
}