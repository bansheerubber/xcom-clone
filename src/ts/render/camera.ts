import Game from "../game/game";
import GameRenderer from "./gameRenderer";
import Vector from "../helpers/vector";
import VectorInterpolation from "../helpers/vectorInterpolation";
import ScalarInterpolation from "../helpers/scalarInterpolation";
import Sprite from "./sprite";

export default abstract class Camera {
	public game: Game
	public renderer: GameRenderer
	public position: Vector = new Vector(0, 0)

	protected _zoom: number = 1
	protected _rotation: number = 0
	protected activePositionInterpolation: VectorInterpolation
	protected activeScalarInterpolation: ScalarInterpolation

	private tempVec: Vector = new Vector(0, 0)



	constructor(game: Game) {
		this.game = game
		this.renderer = game.renderer
	}

	// whether or not the camera shows the specified point
	public shows(point: Vector): boolean {
		let halfWidth = (this.renderer.width / this.zoom) / 2
		let halfHeight = (this.renderer.height / this.zoom) / 2

		if(point.x > this.position.x - halfWidth && point.y > this.position.y - halfHeight
			&& point.x < this.position.x + halfWidth && point.y < this.position.y + halfHeight) {
			return true
		}
		else {
			return false
		}
	}

	// whether or not the camers shows any part of the specified box
	public showsBox(position: Vector, width: number, height: number): boolean {
		function isValueInRange(value: number, min: number, max: number): boolean {
			return value >= min && value <= max
		}

		let corner = this.tempVec.copy(this.position)
		corner.x -= (this.renderer.width / this._zoom) / 2
		corner.y -= (this.renderer.height / this._zoom) / 2

		let xOverlap = isValueInRange(position.x, corner.x, corner.x + this.renderer.width / this._zoom)
			|| isValueInRange(corner.x, position.x, position.x + width)

		let yOverlap = isValueInRange(position.y, corner.y, corner.y + this.renderer.height / this._zoom)
			|| isValueInRange(corner.y, position.y, position.y + height)
		
		return xOverlap && yOverlap
	}

	// interpolate between one position and another based on the interpolation object we provide
	public interpolatePosition(interpolation: VectorInterpolation): void {
		// if we already have an active interpolation, destroy it
		if(this.activePositionInterpolation) {
			this.activePositionInterpolation.destroy()
		}

		this.activePositionInterpolation = interpolation
		interpolation.endCallback = interpolation.callback = (vector: Vector) => {
			this.position.x = vector.x
			this.position.y = vector.y
		}
	}

	// interpolate between one zoom and another based on the interpolation object we provide
	public interpolateZoom(interpolation: ScalarInterpolation): void {
		// if we already have an active interpolation, destroy it
		if(this.activeScalarInterpolation) {
			this.activeScalarInterpolation.destroy()
		}

		this.activeScalarInterpolation = interpolation
		interpolation.endCallback = interpolation.callback = (zoom: number) => {
			this.zoom = zoom
		}
	}

	public tick(deltaTime: number): void {
		let width = Math.floor(this.renderer.pixiApp.screen.width / 2)
		let height = Math.floor(this.renderer.pixiApp.screen.height / 2)

		this.renderer.updateCamera(this.position.x - width / this._zoom, this.position.y - height / this._zoom, this._zoom, this._rotation)
	}

	// callback for when this camera is selected as the active one by the renderer
	public abstract onActivated(): void;
	// callback for when this camera is deselected from active by the renderer
	public abstract onDeActivated(): void;

	set zoom(zoom: number) {
		this._zoom = zoom
	}

	get zoom(): number {
		return this._zoom
	}

	set rotation(rotation: number) {
		this._rotation = rotation
	}

	get rotation(): number {
		return this._rotation
	}

	public mouseToWorld(mouseX: number, mouseY: number): Vector {
		mouseX -= this.renderer.width / 2
		mouseY -= this.renderer.height / 2
		let output = this.position.clone()
		output.x += mouseX * 1 / this.zoom
		output.y += mouseY * 1 / this.zoom
		return output
	}
}