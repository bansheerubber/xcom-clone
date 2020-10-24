import * as React from "react";
import Range from "../../../helpers/range";
import SaveFile from "../../saveFile";
import GeoscapeScene from "../geoscape/geoscapeScene";
const words = require("../../names/words.json");
import { generalNamePicker } from "./generalNamePicker";

const getAcronym = string => string.split(" ").reduce(
	(previous, current) => `${previous}${current[0] ? current[0].toUpperCase() + "." : ""}`,
	''
)

export const commissionNamePicker = (geoscape: GeoscapeScene) => {
	let startingName = `${words[Range.getRandomInt(0, words.length - 1)]} ${words[Range.getRandomInt(0, words.length - 1)]} ${words[Range.getRandomInt(0, words.length - 1)]}`
	return <div>
		<div className="text">
			It is time to decide the name of your alien surveillance commission. Make sure it has a good acronym. The bureaucracy will love that. Please enter it below:
			<br />
			<br />
			<div className="form">
				<label htmlFor="commission-name">Commission Name:</label>
				<input id="commission-name" type="text" onChange={(event) => {
					document.getElementById("acronym-preview").innerHTML = getAcronym(event.target.value)
				}} />
			</div>
			<br />
			Acronym Preview: <span id="acronym-preview"></span>
			<br />
			<div className="error" id="acronym-error"></div>
		</div>
		<div className="dialog-buttons-container">
			<button onClick={() => {
				let commissionName = (document.getElementById("commission-name") as HTMLInputElement).value?.trim() || ""
				if(commissionName.split(" ").length < 2) {
					document.getElementById("acronym-error").innerHTML = "Enter at least two words."
				}
				else {
					geoscape.save.setMiscValue("commissionName", commissionName)
					geoscape.save.setMiscValue("commissionAcronym", getAcronym(commissionName))
					
					geoscape.displayDatacus("Your Name", generalNamePicker(geoscape), true)
				}
			}}>{"<Done>"}</button>
		</div>
	</div>
}