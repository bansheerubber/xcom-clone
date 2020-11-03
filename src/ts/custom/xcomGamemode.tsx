import * as React from "react";
import * as ReactDOM from "react-dom";
import Gamemode from "../game/gamemode";
import { Keybind, KeybindModifier } from "../game/keybinds";
import { RGBColor } from "../helpers/color";
import Vector3d from "../helpers/vector3d";
import ControllableCamera from "./controllableCamera";
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

		let defaultTeam = new Team(this.game)
		this.loadStage("./data/stage2.egg").then(() => {
			let unit = this.stage.createUnit(new Vector3d(14, 22, 1), "person1.png", defaultTeam)
			unit.maxAP = 10
		})

		let selectedUnit: Unit
		let tileGroup = new TileGroup(this.game, this.stage)
		tileGroup.color = new RGBColor(0, 0, 1)
		new Keybind("mouse0", KeybindModifier.NONE, "Select Unit").down((event: MouseEvent) => {
			let position = this.stage.mouseToTileSpace(event.x, event.y)
			if(position) {
				position.z = 1
				selectedUnit = this.stage.getUnit(position)
				this.stage.selectUnit(selectedUnit)
			}
		})

		let hoverPosition
		new Keybind("mouse2", KeybindModifier.NONE, "Move Unit").down((event: MouseEvent) => {
			if(selectedUnit && hoverPosition) {
				selectedUnit.movement.move(hoverPosition)
			}
		})

		document.addEventListener("mousemove", (event) => {
			if(selectedUnit) {
				hoverPosition = this.stage.mouseToTileSpace(event.x, event.y)
				if(hoverPosition && selectedUnit) {
					hoverPosition.z = 1
					selectedUnit.movement.showPath(hoverPosition)
				}
			}
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
			this.mainUI.loadTileSelection(this.stage);
			
			(this.game.renderer.camera as ControllableCamera).stage = this.stage
			
			this.game.renderer.start()
			this.geoscape.stop()

			this.mainUI.setState({
				displayGeoscape: false
			})
		}
	}
}