import * as React from "react";
import { Keybind, KeybindModifier } from "../../game/keybinds";
import type ControllableCamera from "../controllableCamera";
import type Stage from "../stage";
import type Unit from "../units/unit";
import { UNIT_ATTACK } from "../units/unitTargeting";
import type XCOMGamemode from "../xcomGamemode";

interface UnitActionsProps {
	gamemode: XCOMGamemode
	stage: Stage
}

interface UnitActionsState {
	unit: Unit,
	targeting: UNIT_ACTIONS_TARGETING
}

enum UNIT_ACTIONS_TARGETING {
	IDLE,
	SELECT_ATTACK,
}

export default class UnitActionsUI extends React.Component<UnitActionsProps, UnitActionsState> {
	constructor(props) {
		super(props)

		this.state = {
			unit: null,
			targeting: UNIT_ACTIONS_TARGETING.IDLE,
		}

		new Keybind("escape", KeybindModifier.NONE, "Stop Unit Attack").down((event) => {
			if(this.state.targeting != UNIT_ACTIONS_TARGETING.IDLE) {
				this.setTargetingState(UNIT_ACTIONS_TARGETING.IDLE)
			}
		})

		new Keybind("mouse0", KeybindModifier.NONE, "Select Unit").down((event: MouseEvent) => {
			let position = this.props.stage.mouseToTileSpace(event.x, event.y)
			if(position) {
				position.z = 1
				let unit = this.props.stage.getUnit(position)

				if(unit && unit.team == this.props.gamemode.xcomTeam) {
					this.props.stage.selectUnit(unit)	
				}
				else {
					this.setTargetingState(UNIT_ACTIONS_TARGETING.IDLE)
					this.props.stage.selectUnit(null)
				}
			}
		})

		let hoverPosition
		new Keybind("mouse2", KeybindModifier.NONE, "Move Unit").down((event: MouseEvent) => {
			if(this.props.stage.selectedUnit && hoverPosition) {
				this.props.stage.selectedUnit.movement.move(hoverPosition)
			}
		})

		document.addEventListener("mousemove", (event) => {
			if(this.props.stage.selectedUnit) {
				hoverPosition = this.props.stage.mouseToTileSpace(event.x, event.y)
				if(hoverPosition && this.props.stage.selectedUnit && this.state.targeting == UNIT_ACTIONS_TARGETING.IDLE) {
					hoverPosition.z = 1
					this.props.stage.selectedUnit.movement.showPath(hoverPosition)
				}
			}
		})
	}
	
	public setUnit(unit: Unit) {
		this.setState({
			unit,
			targeting: UNIT_ACTIONS_TARGETING.IDLE,
		})
	}

	private moveCameraToTarget() {
		if(this.state.unit.targeting.target) {
			(this.props.stage.game.renderer.camera as ControllableCamera).stagePosition = this.state.unit.targeting.target.position
		}
	}

	private setTarget(index: number) {
		if(this.state.unit) {
			this.state.unit.targeting.targetIndex = index
			this.moveCameraToTarget()

			this.setTargetingState(UNIT_ACTIONS_TARGETING.SELECT_ATTACK)
		}
	}

	private setTargetingState(state: UNIT_ACTIONS_TARGETING) {
		this.setState({
			targeting: state,
		})

		switch(state) {
			case UNIT_ACTIONS_TARGETING.SELECT_ATTACK: {
				(this.props.stage.game.renderer.camera as ControllableCamera).active = false
				this.props.stage.selectedUnit?.movement.clearPath()
				break;
			}
			
			default: {
				(this.props.stage.game.renderer.camera as ControllableCamera).active = true
				this.state.unit?.targeting.clearTarget()
				break;
			}
		}
	}

	public render(): JSX.Element {
		if(this.props.stage) {
			this.props.stage?.setUnitUI(this)
		}
		else if(this.state.unit) {
			this.setUnit(null)
		}

		if(this.state.unit && this.state.unit.team == this.props.gamemode.xcomTeam) {
			let aliens = []
			for(let i = 0; i < this.state.unit.targeting.targetCount; i++) {
				aliens.push(<div className="alien" key={i} onMouseDown={() => this.setTarget(i)}></div>)
			}
			
			return <div className="unit-actions">
				{
					this.state.targeting == UNIT_ACTIONS_TARGETING.SELECT_ATTACK
					?	(
						<>
							<div className="attack-button">
								<b>Accurate Shot</b>
								<span>45% Chance</span>
								<span>20 AP</span>
							</div>
							<div className="attack-button">
								<b>Snapshot</b>
								<span>25% Chance</span>
								<span>10 AP</span>
							</div>
							<div className="attack-button">
								<b>3 Automatic Shots</b>
								<span>15% Chance Per Shot</span>
								<span>10 AP</span>
							</div>
							<div className="line-break" />
						</>
					): null
				}
				{aliens}
			</div>
		}
		else {
			return <></>
		}
	}
}