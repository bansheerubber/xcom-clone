import * as React from "react";
import SaveFile from "../../saveFile";
import GeoscapeScene from "../geoscape/geoscapeScene";
const firstNames = require("../../names/firstNames.json");
const animals = require("../../names/animals.json");
import Range from "../../../helpers/range";

export const generalNamePicker = (geoscape: GeoscapeScene) => <div>
	<div className="text">
		I'm sorry, despite you being a very well known general I'm afraid I never got your name. Please enter it into our system below:
		<br />
		<br />
		<div className="form">
			<label htmlFor="first-name">First Name:</label>
			<input id="first-name" type="text" onChange={event => {
				event.target.value = event.target.value.replace(/\s/g, "")
			}} />
		</div>

		<div className="form">
			<label htmlFor="last-name">Last Name:</label>
			<input id="last-name" type="text" onChange={event => {
				event.target.value = event.target.value.replace(/\s/g, "")
			}} />
		</div>

		<div className="form">
			<label htmlFor="prefix">Prefix:</label>
			<select id="prefix">
				<option value="">None</option>
				<option value="Mr.">Mr.</option>
				<option value="Ms.">Ms.</option>
				<option value="Mrs.">Mrs.</option>
				<option value="Dr.">Dr.</option>
				<option value="Sr.">Sr.</option>
				<option value="Jr.">Jr.</option>
			</select>
		</div>

		<div className="error" id="acronym-error"></div>
	</div>
	<div className="dialog-buttons-container">
		<button onClick={() => {
			let firstName = (document.getElementById("first-name") as HTMLInputElement).value?.trim()
			let lastName = (document.getElementById("last-name") as HTMLInputElement).value?.trim()
			let prefix = (document.getElementById("prefix") as HTMLSelectElement).value

			if(firstName.length == 0 || lastName.length == 0) {
				document.getElementById("acronym-error").innerHTML = "Enter a first and last name."
			}
			else {
				geoscape.save.setMiscValue("generalFirstName", firstName)
				geoscape.save.setMiscValue("generalLastName", lastName)
				geoscape.save.setMiscValue("generalPrefix", prefix ? `${prefix} ` : '')

				geoscape.closeDatacus()

				setTimeout(() => {
					geoscape.displayDialog(
						"Alert: Datacus Message",
						geoscape.save.replace("Welcome to the Terracourium, %%generalPrefix%%%%generalFirstName%% %%generalLastName%%. This globe is the latest technology avaliable to us. You can spin it any which way you want, and it also has a ton of lines drawn on it. If we detect any UFO activity, you'll be able to see it here. Our bases will also be marked on here once we get them built. Go ahead, give the great big ball a whirl."),
						[
							["Thank you", () => { geoscape.closeDialog() }],
						],
					)
				}, 1000)
			}
		}}>{"<Done>"}</button>
	</div>
</div>