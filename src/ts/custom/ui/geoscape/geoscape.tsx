import * as React from "react";
import GeoscapeDatacus from "./geoscapeDatacus";
import GeoscapeDialog from "./geoscapeDialog";
import GeoscapeScene from "./geoscapeScene";

// Terracourium

interface GeoscapeUIProps {
	scene: GeoscapeScene
	display: boolean
}

export default class GeoscapeUI extends React.Component<GeoscapeUIProps> {
	constructor(props) {
		super(props)
	}

	public render(): JSX.Element {
		return <div className="geoscape" ref={ref => ref?.appendChild(this.props.scene.renderer.domElement)} style={{
			display: this.props.display ? "block" : "none"
		}}>
			<GeoscapeDialog scene={this.props.scene} />
			<GeoscapeDatacus scene={this.props.scene} />
		</div>
	}
}