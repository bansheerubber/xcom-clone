import * as React from "react"
import Game from "../../game/game"
import { Keybind, KeybindModifier } from "../../game/keybinds"
import Vector3d from "../../helpers/vector3d"
import WebFileReader from "../../helpers/webFileReader"
import GhostTile from "../ghostTile"
import Stage from "../stage"

interface TileSelectionProps {
	game: Game
	stage: Stage
}

interface TileSelectionState {
	selectedId: number
	frames: {
		[name: string]: {
			frame: {
				x: number,
				y: number,
				w: number,
				h: number,
			}
			rotated: boolean
			trimmed: boolean
			spriteSourceSize: {
				x: number,
				y: number,
				w: number,
				h: number,
			}
			sourceSize: {
				w: number,
				h: number,
			}
		}
	}
}

export default class TileSelection extends React.Component<TileSelectionProps, TileSelectionState> {
	private ghostTile: GhostTile
	private spaceHeldDown: boolean = false
	private deleteHeldDown: boolean = false
	
	
	
	constructor(props) {
		super(props)

		this.ghostTile = this.props.stage.createTile(Vector3d.getTempVector(0).set(5, 5, 1), 83, 10, GhostTile) as GhostTile
		this.ghostTile.opacity = 0.8

		new WebFileReader("./data/sprites/spritesheet test.json").readFile().then((json: string) => {
			this.setState({
				frames: JSON.parse(json).frames
			})
		})

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
			this.props.stage.tileMap[this.props.stage.defaultLayer][this.ghostTile.getPosition().unique()]?.destroy()
		}

		new Keybind("mouse0", KeybindModifier.NONE, "Select Tile").down((event: MouseEvent) => {
			let vector = this.props.stage.mouseToTileSpace(event.x, event.y)

			if(vector) {
				vector.z = this.ghostTile.getPosition().z
				this.ghostTile.setPosition(vector)

				if(this.spaceHeldDown) {
					plantTile()
				}
				else if(this.deleteHeldDown) {
					deleteTile()
				}
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
			selectedId: -1,
			frames: null,
		}
	}

	render(): JSX.Element {
		let elements = []
		let spriteSheetSize = 990
		let spriteSize = 64
		let maxCount = 280

		if(this.state.frames) {
			let index = 0
			for(let name in this.state.frames) {
				let frame = this.state.frames[name]
				elements.push(<div className="tile-preview" id={`${index}`} key={index} onClick={(event) => {
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
					backgroundPositionX: -frame.frame.x,
					backgroundPositionY: -frame.frame.y,
					backgroundColor: this.state.selectedId == index ? "#FFFF00" : null
				}}>{index}</div>)
				index++
			}
		}

		return <div className="tile-selection">
			<div className="tile-scroll">
				{elements}
			</div>
			<button onClick={() => this.props.stage.save()}>Save Stage</button>
		</div>
	}
}