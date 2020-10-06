import Vector from "../../helpers/vector";
import Game from "../../game/game";
import GameObject from "../../game/gameObject";
import Line from "./line";
import { RGBColor } from "../../helpers/color";

export default class LineGroup extends GameObject {
	private points: Vector[] = [] // an array of all the points we need to connect
	private lines: Line[] = []
	private width_: number = 1
	private color_: RGBColor = new RGBColor(0, 0, 0, 1)
	private isVisible_: boolean = true



	constructor(game: Game) {
		super(game, {
			canTick: false,
		})
	}

	public add(vector: Vector): void {
		this.points.push(vector)
		this.rebuildLines()
	}

	public clear(): void {
		this.points = []
		this.rebuildLines()
	}

	public set width(width: number) {
		this.rebuildLines()
		this.width_ = width
	}

	public get width(): number {
		return this.width_
	}

	public set color(color: RGBColor) {
		for(let line of this.lines) {
			line.color = color
		}
		this.color_ = color
	}

	public get color(): RGBColor {
		return this.color_
	}

	public set isVisible(isVisible: boolean) {
		this.isVisible_ = isVisible
		for(let line of this.lines) {
			line.isVisible = isVisible
		}
	}

	public get isVisible(): boolean {
		return this.isVisible_
	}

	private rebuildLines(): void {
		for(let line of this.lines) {
			line.destroy()
		}
		this.lines = []

		for(let i = 1; i < this.points.length; i++) {
			let start = this.points[i - 1] // start of line i, end of line i - 1
			let end = this.points[i] // end of line i, start of line i + 1

			let line = new Line(this.game)
			line.start = start
			line.end = end
			line.width = this.width
			line.color = this.color
			this.lines.push(line)
		}

		// go through an apply line extending algorithm to each line
		for(let i = 0; i < this.lines.length; i++) {
			let previousLine = this.lines[i - 1]
			let line = this.lines[i]
			let nextLine = this.lines[i + 1]

			if(previousLine) {
				let direction = line.direction
				let f = (1 - Math.abs(direction.dot(previousLine.direction))) * this.width / 2
				line.start = line.start.sub(direction.mul_(f))
			}

			if(nextLine) {
				let direction = line.direction
				let f = (1 - Math.abs(direction.dot(nextLine.direction))) * this.width / 2
				line.end = line.end.add(direction.mul_(f))
			}
		}
	}

	public destroy(): void {
		super.destroy()
		for(let line of this.lines) {
			line.destroy()
		}
		this.points = []
	}
}