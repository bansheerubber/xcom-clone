import * as React from "react"
import Game from "../../game/game"
import { Keybind, KeybindModifier } from "../../game/keybinds"
import { RGBColor } from "../../helpers/color"
import Vector3d from "../../helpers/vector3d"
import WebFileReader from "../../helpers/webFileReader"
import GhostTile from "../ghostTile"
import Stage, { StageLayer, StageRotation } from "../stage"
import TileLight from "../tileLight"
import TileRaycast from "../tileRaycast"

interface TileSelectionProps {
	game: Game
	stage: Stage
}

interface TileSelectionState {
	selectedLight: TileLight
	selectedId: number
	lightEdit: {
		red: string | number,
		green: string | number,
		blue: string | number,
		radius: string | number,
	}
	tileList: JSX.Element[]
	/*frames: {
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
	}*/
}

export default class TileSelection extends React.Component<TileSelectionProps, TileSelectionState> {
	private ghostTile: GhostTile
	private spaceHeldDown: boolean = false
	private deleteHeldDown: boolean = false
	private tilesList: JSX.Element[] = []
	
	
	
	constructor(props) {
		super(props)

		this.ghostTile = this.props.stage.createTile(Vector3d.getTempVector(0).set(5, 5, 1), 83, StageLayer.DEV_GHOST_LAYER, GhostTile) as GhostTile
		this.ghostTile.opacity = 0.8

		new WebFileReader("./data/sprites/spritesheet test.json").readFile().then((json: string) => {
			let index = 0
			let elements = []
			let frames = JSON.parse(json).frames
			for(let name in frames) {
				let frame = frames[name]
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
			
			this.setState({
				tileList: elements,
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
			let type = this.ghostTile.type

			switch(type) {
				// lights
				case 281: {
					new TileLight(this.props.game, this.props.stage, this.ghostTile.position, 5, new RGBColor(0.3, 0.3, 0.3))
					break
				}

				default: {
					this.props.stage.createTile(this.ghostTile.position, type)
					break
				}
			}

			moveGhost(this.ghostTile.position)
		}

		let deleteTile = () => {
			this.props.stage.getMapTile(this.ghostTile.position)?.destroy()
		}

		let moveGhost = (position: Vector3d) => {
			this.ghostTile.position = position

			let light = this.props.stage.getLight(position)
			if(light) {
				this.setState({
					selectedLight: light,
					lightEdit: {
						red: light.color.r,
						green: light.color.g,
						blue: light.color.b,
						radius: light.radius,
					},
				})
			}
			else {
				this.setState({
					selectedLight: null,
				})
			}
		}

		moveGhost(new Vector3d(5, 5, 1))

		new Keybind("mouse0", KeybindModifier.NONE, "Select Tile").down((event: MouseEvent) => {
			let vector = this.props.stage.mouseToTileSpace(event.x, event.y)

			if(vector) {
				vector.z = this.ghostTile.position.z
				moveGhost(vector)

				if(this.spaceHeldDown) {
					plantTile()
				}
				else if(this.deleteHeldDown) {
					deleteTile()
				}
			}
		})

		new Keybind("arrowup", KeybindModifier.NONE, "Move Tile East").down((event: KeyboardEvent) => {
			let x, y
			switch(this.props.stage.rotation) {
				case StageRotation.DEG_0: {
					x = 1
					y = 0
					break
				}

				case StageRotation.DEG_90: {
					x = 0
					y = 1
					break
				}

				case StageRotation.DEG_180: {
					x = -1
					y = 0
					break
				}

				case StageRotation.DEG_270: {
					x = 0
					y = -1
					break
				}
			}
			
			moveGhost(this.ghostTile.position.$add(x, y, 0).foreach(limit))

			if(this.spaceHeldDown) {
				plantTile()
			}
			else if(this.deleteHeldDown) {
				deleteTile()
			}
		})

		new Keybind("arrowdown", KeybindModifier.NONE, "Move Tile West").down((event: KeyboardEvent) => {
			let x, y
			switch(this.props.stage.rotation) {
				case StageRotation.DEG_0: {
					x = -1
					y = 0
					break
				}

				case StageRotation.DEG_90: {
					x = 0
					y = -1
					break
				}

				case StageRotation.DEG_180: {
					x = 1
					y = 0
					break
				}

				case StageRotation.DEG_270: {
					x = 0
					y = 1
					break
				}
			}
			
			moveGhost(this.ghostTile.position.$add(x, y, 0).foreach(limit))

			if(this.spaceHeldDown) {
				plantTile()
			}
			else if(this.deleteHeldDown) {
				deleteTile()
			}
		})

		new Keybind("arrowleft", KeybindModifier.NONE, "Move Tile North").down((event: KeyboardEvent) => {
			let x, y
			switch(this.props.stage.rotation) {
				case StageRotation.DEG_0: {
					x = 0
					y = -1
					break
				}

				case StageRotation.DEG_90: {
					x = 1
					y = 0
					break
				}

				case StageRotation.DEG_180: {
					x = 0
					y = 1
					break
				}

				case StageRotation.DEG_270: {
					x = -1
					y = 0
					break
				}
			}
			
			moveGhost(this.ghostTile.position.$add(x, y, 0).foreach(limit))

			if(this.spaceHeldDown) {
				plantTile()
			}
			else if(this.deleteHeldDown) {
				deleteTile()
			}
		})

		new Keybind("arrowright", KeybindModifier.NONE, "Move Tile South").down((event: KeyboardEvent) => {
			let x, y
			switch(this.props.stage.rotation) {
				case StageRotation.DEG_0: {
					x = 0
					y = 1
					break
				}

				case StageRotation.DEG_90: {
					x = -1
					y = 0
					break
				}

				case StageRotation.DEG_180: {
					x = 0
					y = -1
					break
				}

				case StageRotation.DEG_270: {
					x = 1
					y = 0
					break
				}
			}
			
			moveGhost(this.ghostTile.position.$add(x, y, 0).foreach(limit))

			if(this.spaceHeldDown) {
				plantTile()
			}
			else if(this.deleteHeldDown) {
				deleteTile()
			}
		})

		new Keybind("pageup", KeybindModifier.NONE, "Move Tile Up").down((event: KeyboardEvent) => {
			moveGhost(this.ghostTile.position.$add(0, 0, 1).foreach(limit))

			if(this.spaceHeldDown) {
				plantTile()
			}
			else if(this.deleteHeldDown) {
				deleteTile()
			}
		})

		new Keybind("pagedown", KeybindModifier.NONE, "Move Tile Down").down((event: KeyboardEvent) => {
			moveGhost(this.ghostTile.position.$add(0, 0, -1).foreach(limit))

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
			selectedLight: null,
			lightEdit: {
				red: "",
				green: "",
				blue: "",
				radius: "",
			},
			selectedId: -1,
			tileList: []
		}
	}

	render(): JSX.Element {
		return <div className="tile-selection">
			<div className="tile-scroll">
				{this.state.tileList}
			</div>
			<div className="light-edit" style={{
				display: this.state.selectedLight ? "block" : "none"
			}}>
				<b>Light</b>
				<div>
					<label htmlFor="light-radius">Radius:</label>
					<input id="light-radius" value={this.state.lightEdit.radius} onChange={(event) => {
						let radius = parseInt(event.target.value)
						if(!isNaN(radius)) {
							this.state.selectedLight.radius = Math.min(100, radius)
						}
						else if(event.target.value == "") {
							this.state.selectedLight.radius = 0
						}

						this.setState({
							lightEdit: {
								...this.state.lightEdit,
								radius: event.target.value
							}
						})
					}} type="text" style={{
						width: 50
					}} />
				</div>
				<div>
					<label>Color:</label>
					<input type="text" value={this.state.lightEdit.red} onChange={(event) => {
						let value = parseFloat(event.target.value)
						if(!isNaN(value)) {
							this.state.selectedLight.color.r = Math.min(1, value)
							this.state.selectedLight.color = this.state.selectedLight.color
						}
						else if(event.target.value == "") {
							this.state.selectedLight.color.r = 0
							this.state.selectedLight.color = this.state.selectedLight.color
						}

						this.setState({
							lightEdit: {
								...this.state.lightEdit,
								red: event.target.value
							}
						})
					}} style={{
						width: 50
					}} />
					<input type="text" value={this.state.lightEdit.green} onChange={(event) => {
						let value = parseFloat(event.target.value)
						if(!isNaN(value)) {
							this.state.selectedLight.color.g = Math.min(1, value)
							this.state.selectedLight.color = this.state.selectedLight.color
						}
						else if(event.target.value == "") {
							this.state.selectedLight.color.g = 0
							this.state.selectedLight.color = this.state.selectedLight.color
						}

						this.setState({
							lightEdit: {
								...this.state.lightEdit,
								green: event.target.value
							}
						})
					}} style={{
						width: 50
					}} />
					<input type="text" value={this.state.lightEdit.blue} onChange={(event) => {
						let value = parseFloat(event.target.value)
						if(!isNaN(value)) {
							this.state.selectedLight.color.b = Math.min(1, value)
							this.state.selectedLight.color = this.state.selectedLight.color
						}
						else if(event.target.value == "") {
							this.state.selectedLight.color.b = 0
							this.state.selectedLight.color = this.state.selectedLight.color
						}

						this.setState({
							lightEdit: {
								...this.state.lightEdit,
								blue: event.target.value
							}
						})
					}} style={{
						width: 50
					}} />
				</div>
				<button onClick={() => {
					this.state.selectedLight.destroy()
					this.setState({
						selectedLight: null,
					})
				}}>Delete Light</button>
			</div>
			<button onClick={() => this.props.stage.save()}>Save Stage</button>
		</div>
	}
}