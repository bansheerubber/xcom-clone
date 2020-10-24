import * as React from "react"
import Game from "../../game/game"
import GeoscapeUI from "./geoscape/geoscape"
import Stage from "../stage"
import TileSelection from "./tileSelection"
import GeoscapeScene from "./geoscape/geoscapeScene"
import GeoscapeDatacus from "./geoscape/geoscapeDatacus"

interface MainUIProps {
	game: Game
	geoscapeScene: GeoscapeScene
}

interface MainUIState {
	displayGeoscape: boolean
}

export default class MainUI extends React.Component<MainUIProps, MainUIState> {
	constructor(props) {
		super(props)

		this.state = {
			displayGeoscape: false
		}
	}
	
	render(): JSX.Element {
		return <>
			{/* <TileSelection game={this.props.game} stage={this.props.stage} /> */}
			<GeoscapeUI scene={this.props.geoscapeScene} display={this.state.displayGeoscape} />
		</>
	}
}