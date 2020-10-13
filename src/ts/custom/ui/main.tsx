import * as React from "react"
import Game from "../../game/game"
import GeoscapeUI from "./geoscape/geoscape"
import Stage from "../stage"
import TileSelection from "./tileSelection"
import GeoscapeScene from "./geoscape/geoscapeScene"

interface MainUIProps {
	game: Game
	stage: Stage
	geoscapeScene: GeoscapeScene
}

export default class MainUI extends React.Component<MainUIProps> {
	render(): JSX.Element {
		return <>
			{/* <TileSelection game={this.props.game} stage={this.props.stage} /> */}
			<GeoscapeUI scene={this.props.geoscapeScene} />
		</>
	}
}