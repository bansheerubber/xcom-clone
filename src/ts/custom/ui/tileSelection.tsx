import * as React from "react"
import Game from "../../game/game"
import { Keybind, KeybindModifier } from "../../game/keybinds"
import Vector3d from "../../helpers/vector3d"
import GhostTile from "../ghostTile"
import Stage from "../stage"

interface TileSelectionProps {
	game: Game
	stage: Stage
}

interface TileSelectionState {
	selectedId: number
}

export default class TileSelection extends React.Component<TileSelectionProps, TileSelectionState> {
	private ghostTile: GhostTile
	private spaceHeldDown: boolean = false
	private deleteHeldDown: boolean = false
	
	
	
	constructor(props) {
		super(props)

		this.ghostTile = this.props.stage.createTile(Vector3d.getTempVector(0).set(5, 5, 1), 83, 1, GhostTile) as GhostTile
		this.ghostTile.opacity = 0.8

		let limit = (input: number) => {
			if(input < 0) {
				return 0
			}
			else {
				return input
			}
		}

		let plantTile = () => {
			this.props.stage.createTile(this.ghostTile.getPosition(), this.ghostTile.type)
		}

		let deleteTile = () => {
			this.props.stage.tileMap[0][this.ghostTile.getPosition().unique()]?.destroy()
		}

		new Keybind("mouse0", KeybindModifier.NONE, "Select Tile").down((event: MouseEvent) => {
			let vector = this.props.stage.mouseToTileSpace(event.x, event.y)
			vector.z = this.ghostTile.getPosition().z
			this.ghostTile.setPosition(vector)

			if(this.spaceHeldDown) {
				plantTile()
			}
			else if(this.deleteHeldDown) {
				deleteTile()
			}
		})

		new Keybind("arrowup", KeybindModifier.NONE, "Move Tile East").down((event: KeyboardEvent) => {
			this.ghostTile.setPosition(this.ghostTile.getPosition().$add(1, 0, 0).foreach(limit))

			if(this.spaceHeldDown) {
				plantTile()
			}
			else if(this.deleteHeldDown) {
				deleteTile()
			}
		})

		new Keybind("arrowdown", KeybindModifier.NONE, "Move Tile West").down((event: KeyboardEvent) => {
			this.ghostTile.setPosition(this.ghostTile.getPosition().$add(-1, 0, 0).foreach(limit))

			if(this.spaceHeldDown) {
				plantTile()
			}
			else if(this.deleteHeldDown) {
				deleteTile()
			}
		})

		new Keybind("arrowleft", KeybindModifier.NONE, "Move Tile North").down((event: KeyboardEvent) => {
			this.ghostTile.setPosition(this.ghostTile.getPosition().$add(0, -1, 0).foreach(limit))

			if(this.spaceHeldDown) {
				plantTile()
			}
			else if(this.deleteHeldDown) {
				deleteTile()
			}
		})

		new Keybind("arrowright", KeybindModifier.NONE, "Move Tile South").down((event: KeyboardEvent) => {
			this.ghostTile.setPosition(this.ghostTile.getPosition().$add(0, 1, 0).foreach(limit))

			if(this.spaceHeldDown) {
				plantTile()
			}
			else if(this.deleteHeldDown) {
				deleteTile()
			}
		})

		new Keybind("pageup", KeybindModifier.NONE, "Move Tile Up").down((event: KeyboardEvent) => {
			this.ghostTile.setPosition(this.ghostTile.getPosition().$add(0, 0, 1).foreach(limit))

			if(this.spaceHeldDown) {
				plantTile()
			}
			else if(this.deleteHeldDown) {
				deleteTile()
			}
		})

		new Keybind("pagedown", KeybindModifier.NONE, "Move Tile Down").down((event: KeyboardEvent) => {
			this.ghostTile.setPosition(this.ghostTile.getPosition().$add(0, 0, -1).foreach(limit))

			if(this.spaceHeldDown) {
				plantTile()
			}
			else if(this.deleteHeldDown) {
				deleteTile()
			}
		})

		new Keybind(" ", KeybindModifier.NONE, "Move Tile Down").down((event: KeyboardEvent) => {
			plantTile()
			this.spaceHeldDown = true
		}).up((event: KeyboardEvent) => {
			this.spaceHeldDown = false
		})

		new Keybind("delete", KeybindModifier.NONE, "Move Tile Down").down((event: KeyboardEvent) => {
			deleteTile()
			this.deleteHeldDown = true
		}).up((event: KeyboardEvent) => {
			this.deleteHeldDown = false
		})

		this.state = {
			selectedId: -1
		}
	}

	render(): JSX.Element {
		let elements = []
		let spriteSheetSize = 1984
		let spriteSize = 64
		let maxCount = 277

		for(let i = 0; i <= maxCount; i++) {
			let x = i % (spriteSheetSize / spriteSize)
			let y = Math.floor(i * spriteSize / spriteSheetSize)

			elements.push(<div className="tile-preview" id={`${i}`} key={i} onClick={(event) => {
				let id = parseInt(event.currentTarget.id)
				if(id != this.state.selectedId) {
					this.setState({
						selectedId: id,
					})
					this.ghostTile.type = id
				}
				else {
					this.setState({
						selectedId: -1,
					})
				}		
			}} style={{
				backgroundPositionX: -x * spriteSize,
				backgroundPositionY: -y * spriteSize,
				backgroundColor: this.state.selectedId == i ? "#FFFF00" : null
			}}>{i}</div>)
		}

		return <div className="tile-selection">
			{elements}
		</div>
	}
}