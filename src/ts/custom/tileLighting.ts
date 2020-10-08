import * as PIXI from "pixi.js"
import GameObject from "../game/gameObject";
import { RGBColor } from "../helpers/color";
import Vector3d from "../helpers/vector3d";
import Stage from "./stage";
import Tile from "./tile";

export default class TileLighting extends GameObject {
	public stage: Stage
	protected position: Vector3d
	protected radius: number
	protected color: RGBColor
	protected lightTiles: Set<Tile> = new Set()



	constructor(game, stage: Stage, position: Vector3d, radius: number, color: RGBColor) {
		super(game)
		this.stage = stage
		this.position = position
		this.radius = radius
		this.color = color
	}

	public drawLight() {
		for(let light of this.lightTiles) {
			light.destroy()
		}
		this.lightTiles = new Set()

		for(let x = -this.radius; x <= this.radius; x++) {
			let dy = Math.floor(Math.sqrt(this.radius ** 2 - x ** 2))
			for(let y = -dy; y <= dy; y++) {
				let position = Vector3d.getTempVector(0).set(this.position.x + x, this.position.y + y, this.position.z)
				let light = this.stage.createTile(position, 280, 0)
				this.lightTiles.add(light)
				light.tint = this.color
				light.opacity = 1 - position.dist(this.position) / this.radius
				light.blendMode = PIXI.BLEND_MODES.ADD
			}
		}
	}
}