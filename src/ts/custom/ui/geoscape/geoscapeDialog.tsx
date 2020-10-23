import * as React from "react";
import GeoscapeScene from "./geoscapeScene";

interface GeoscapeDialogProps {
	scene: GeoscapeScene
}

interface GeoscapeDialogState {
	description: string
	image: string
	title: string
	buttons: [string, () => void][]
	display: boolean
	tick: number
	interval: NodeJS.Timeout
}

export default class GeoscapeDialog extends React.Component<GeoscapeDialogProps, GeoscapeDialogState> {
	private static CHARACTERS_PER_TICK = 150
	private static BORDER_DONE_TICK = 3
	
	constructor(props) {
		super(props)

		this.props.scene.dialog = this

		this.state = {
			description: "",
			image: "",
			title: "",
			buttons: [],
			display: false,
			tick: -1,
			interval: null,
		}
	}

	render(): JSX.Element {
		if(this.state.tick == -1) {
			this.setState({
				tick: this.state.tick + 1,
				interval: setInterval(() => {
					this.setState({
						tick: this.state.tick + 1,
					})
	
					if(this.state.tick > GeoscapeDialog.BORDER_DONE_TICK
						+ Math.floor(this.state.description.length / GeoscapeDialog.CHARACTERS_PER_TICK) * 1.5
					) {
						clearInterval(this.state.interval)
					}
				}, 100)
			})
		}
		
		let description = []
		for(let i = 0; i < this.state.description.length; i += GeoscapeDialog.CHARACTERS_PER_TICK) {
			description.push(<span key={i} style={{
				color: this.state.tick >= GeoscapeDialog.BORDER_DONE_TICK
					+ i / GeoscapeDialog.CHARACTERS_PER_TICK * 1.5 ? "" : "transparent",
			}}>{this.state.description.substring(i, i + GeoscapeDialog.CHARACTERS_PER_TICK)}</span>)
		}

		let buttons = []
		for(let i = 0; i < this.state.buttons.length; i++) {
			let [text, method] = this.state.buttons[i]
			buttons.push(<button onClick={method} style={{
				color: this.state.tick >= GeoscapeDialog.BORDER_DONE_TICK
					+ Math.floor(this.state.description.length / GeoscapeDialog.CHARACTERS_PER_TICK) * 1.5 ? "" : "transparent",
			}}>{"<"}{text}{">"}</button>)
		}
		
		return <div className="datacus" style={{
			display: this.state.display ? "block" : "none"
		}}>
			<div className="container" style={{
				"borderRight": this.state.tick >= 1 ? "" : "1px solid transparent",
				"borderBottom": this.state.tick >= 2 ? "" : "1px solid transparent",
				"borderLeft": this.state.tick >= 2 ? "" : "1px solid transparent",
				"width": 600,
			}}>
				<span className="title">{this.state.title}</span>
				<img src={this.state.image} style={{
					display: this.state.image ? "block" : "none",
				}} />
				<div className="text">
					{description}
				</div>
				<div className="dialog-buttons-container">
					{buttons}
				</div>
			</div>
		</div>
	}
}