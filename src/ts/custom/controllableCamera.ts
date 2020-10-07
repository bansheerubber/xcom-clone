import Camera from "../render/camera";
import Vector from "../helpers/vector";
import Game from "../game/game";
import { Keybind } from "../game/keybinds";

interface CameraMove {
	up: number,
	down: number,
	right: number,
	left: number
}

export default class ControllableCamera extends Camera {
	public move: CameraMove = {
		up: 0,
		down: 0,
		right: 0,
		left: 0
	}
	public speed: number = 750
	public active: boolean = true // whether or not we can use the keybinds to move this camera around



	constructor(game: Game) {
		super(game)

		// move the camera up with W
		new Keybind("w", Keybind.None, "Move Camera Up").down(() => {
			this.move.up = 1
		}).up(() => {
			this.move.up = 0
		})

		// move the camera down with S
		new Keybind("s", Keybind.None, "Move Camera Down").down(() => {
			this.move.down = 1
		}).up(() => {
			this.move.down = 0
		})

		// move the camera left with A
		new Keybind("a", Keybind.None, "Move Camera Left").down(() => {
			this.move.left = 1
		}).up(() => {
			this.move.left = 0
		})

		// move the camera right with D
		new Keybind("d", Keybind.None, "Move Camera Right").down(() => {
			this.move.right = 1
		}).up(() => {
			this.move.right = 0
		})

		// zoom in the camera with +
		new Keybind("=", Keybind.None, "Zoom In").down(() => {
			this.zoom += this.zoom * 0.1
		})

		// zoom out the camera with -
		new Keybind("-", Keybind.None, "Zoom Out").down(() => {
			this.zoom += this.zoom * -0.1
		})
	}
	
	public tick(deltaTime: number): void {
		// apply move to the position
		if(this.active) {
			let speed = this.speed * deltaTime / this.zoom
			this.position.add(new Vector(-this.move.left * speed + this.move.right * speed, -this.move.up * speed + this.move.down * speed))
		}
		
		super.tick(deltaTime)
	}
	
	// called when the camera is switched to
	public onActivated(): void {
		this.move.up = 0
		this.move.down = 0
		this.move.right = 0
		this.move.left = 0
	}

	// called when the camera is switched away from
	public onDeActivated(): void {
		this.move.up = 0
		this.move.down = 0
		this.move.right = 0
		this.move.left = 0
	}
}