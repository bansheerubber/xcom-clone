import * as React from "react";
import * as ReactDOM from "react-dom";
import Gamemode from "../game/gamemode";
import { Keybind, KeybindModifier } from "../game/keybinds";
import { RGBColor } from "../helpers/color";
import Vector3d from "../helpers/vector3d";
import ControllableCamera from "./controllableCamera";
import MachineGun from "./items/guns/machineGun";
import Stage from "./stage";
import Team from "./team";
import TileGroup from "./tileGroup";
import GeoscapeCountry from "./ui/geoscape/geoscapeCountry";
import GeoscapeIncident from "./ui/geoscape/geoscapeIncident";
import GeoscapeScene from "./ui/geoscape/geoscapeScene";
import MainUI from "./ui/main";
import Unit from "./units/unit";

export default class XCOMGamemode extends Gamemode {
	private stage: Stage
	public geoscape: GeoscapeScene
	public mainUI: MainUI
	public xcomTeam: Team
	public alienTeam: Team

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

		// this.focusGeoscape()
		this.game.renderer.camera = new ControllableCamera(game, null)
		this.game.renderer.camera.zoom = 1.5

		this.xcomTeam = new Team(this.game)
		this.alienTeam = new Team(this.game)
		this.loadStage("./data/stage2.egg").then(() => {
			let unit = this.stage.createUnit(new Vector3d(14, 22, 1), "person", this.xcomTeam)
			unit.maxAP = 10
			unit.targeting.range = 25
			unit.equippedWeapon = new MachineGun(this.game, unit)

			let alien = this.stage.createUnit(new Vector3d(20, 22, 1), "alien", this.alienTeam)
			alien.maxAP = 20

			let alien2 = this.stage.createUnit(new Vector3d(35, 22, 1), "alien", this.alienTeam)
			alien2.maxAP = 20

			let alien3 = this.stage.createUnit(new Vector3d(35, 30, 1), "alien", this.alienTeam)
			alien3.maxAP = 20
		})

		/*setTimeout(() => {
			this.geoscape.displayDatacus("Choose Commission Name", commissionNamePicker(this.geoscape), true)
		}, 1000)*/
	}

	public async startTurn(team: Team) {
		for(let unit of team.units) {
			unit.refillAP()
		}
	}
	
	public async loadStage(filename: string) {
		this.stage?.destroy()
		this.stage = new Stage(this.game)
		return this.stage.load(filename).then(() => {
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

	public focusStage(stage?: Stage) {
		if(stage) {
			this.stage = stage
		}
		
		if(this.stage) {
			this.mainUI.setStage(this.stage);
			
			(this.game.renderer.camera as ControllableCamera).stage = this.stage
			
			this.game.renderer.start()
			this.geoscape.stop()

			this.mainUI.setState({
				displayGeoscape: false
			})
		}
	}
}