import * as React from "react"
import Game from "../../game/game"
import Geoscape from "../geoscape"
import Stage from "../stage"
import TileSelection from "./tileSelection"

interface MainUIProps {
	game: Game
	stage: Stage
}

export default class MainUI extends React.Component<MainUIProps> {
	render(): JSX.Element {
		return <>
			<TileSelection game={this.props.game} stage={this.props.stage} />
			{/* <Geoscape /> */}
		</>
	}
}