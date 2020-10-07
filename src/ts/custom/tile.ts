import GameObject from "../game/gameObject";
import { RGBColor } from "../helpers/color";
import Range from "../helpers/range";
import Vector from "../helpers/vector";
import Vector3d from "../helpers/vector3d";
import SpriteSheet from "../render/spriteSheet";
import TileChunk from "./tileChunk";

export default class Tile extends GameObject {
	public static TILE_SIZE: number = 64

	private chunk: TileChunk
	private sprite: SpriteSheet
	/**
	 * the position of our tile in tilespace
	 */
	private position: Vector3d = new Vector3d(0, 0, 0)



	constructor(game) {
		super(game, {
			canTick: false,
		})

		this.sprite = new SpriteSheet(this.game, "./data/sprites/spritesheet test.json", this.game.renderer.isomap)
		this.sprite.isVisible = false
		this.sprite.sheetIndex = 13
	}

	public setPosition(vector: Vector3d) {
		this.position.copy(vector)

		let spritePosition = this.sprite.getPosition()
		spritePosition.x = this.position.x * Tile.TILE_SIZE / 2 + this.position.y * Tile.TILE_SIZE / 2 
		spritePosition.y = this.position.x * -Tile.TILE_SIZE / 4 + this.position.y * Tile.TILE_SIZE / 4 - this.position.z * Tile.TILE_SIZE / 2

		this.sprite.setPosition(spritePosition)
		this.sprite.zIndex = -this.position.x + this.position.y + this.position.z

		let tint = (30 - this.position.z) / 30
		this.sprite.tint = new RGBColor(tint, tint, tint)
	}

	public getPosition(): Vector3d {
		return this.position
	}
	
	public setContainer(container) {
		this.sprite.container = container
	}

	public setChunk(chunk: TileChunk) {
		this.chunk = chunk
		this.sprite.isVisible = true
	}
}