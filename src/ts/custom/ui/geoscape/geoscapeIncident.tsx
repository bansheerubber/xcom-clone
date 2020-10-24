import * as React from  "react";
import XCOMGamemode from "../../xcomGamemode";
import GeoscapeIcon from "./geoscapeIcon";
import GeoscapeScene from "./geoscapeScene";

export const incident = (geoscape: GeoscapeScene) => <div>
	<div className="text">
		{geoscape.save.replace(
			"We have detected an alien craft landed at this location. It appears the aliens are abducting citizens here, and expect %%commissionAcronym%% interference."
		)}
		<br />
		<br />
		Reports:
		<ul>
			<li className="red">Heavy unit support (50% chance)</li>
			<li>High alien activity</li>
			<li>High civilian population</li>
			<li>Average arms</li>
		</ul>
	</div>
	<div className="dialog-buttons-container">
		<button onClick={() => {
			geoscape.closeDatacus();
			(geoscape.game.gamemode as XCOMGamemode).loadStage("./data/stage.egg")
		}}>{"<Investigate>"}</button>
		<button onClick={() => geoscape.closeDatacus()}>{"<Do Nothing>"}</button>
	</div>
</div>

export default class GeoscapeIncident extends GeoscapeIcon {
	constructor(game, geoscape) {
		super(game, geoscape, "./data/landed.png")
	}
	
	public onClick() {
		this.geoscape.displayDatacus("Alert: Landed UFO", incident(this.geoscape))
	}
}