import * as React from "react";
import GeoscapeIcon from "./geoscapeIcon";
import GeoscapeScene from "./geoscapeScene";

// Terracourium

interface GeoscapeUIProps {
	scene: GeoscapeScene
}

export default class GeoscapeUI extends React.Component<GeoscapeUIProps> {
	constructor(props) {
		super(props)
	}

	public render(): JSX.Element {
		return <div className="geoscape" ref={ref => ref.appendChild(this.props.scene.renderer.domElement)}></div>
	}
}