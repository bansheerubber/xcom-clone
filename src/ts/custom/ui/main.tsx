import * as React from "react"
import Game from "../../game/game"
import GeoscapeUI from "./geoscape/geoscape"
import Stage from "../stage"
import TileSelection from "./tileSelection"
import GeoscapeScene from "./geoscape/geoscapeScene"
import GeoscapeDatacus from "./geoscape/geoscapeDatacus"
import UnitActionsUI from "./unitActions"
import type XCOMGamemode from "../xcomGamemode"

interface MainUIProps {
	game: Game
	geoscapeScene: GeoscapeScene
}

interface MainUIState {
	displayGeoscape: boolean
	stage: Stage
}

export default class MainUI extends React.Component<MainUIProps, MainUIState> {
	constructor(props) {
		super(props)

		this.state = {
			displayGeoscape: false,
			stage: null
		}
	}

	public setStage(stage: Stage) {
		this.setState({
			stage
		})
	}
	
	render(): JSX.Element {
		return <>
			{/* {this.state.stage ? <TileSelection game={this.props.game} stage={this.state.stage} /> : null} */}
			<GeoscapeUI scene={this.props.geoscapeScene} display={this.state.displayGeoscape} />
			<UnitActionsUI stage={this.state.stage} gamemode={this.props.game.gamemode as XCOMGamemode} />
		</>
	}
}