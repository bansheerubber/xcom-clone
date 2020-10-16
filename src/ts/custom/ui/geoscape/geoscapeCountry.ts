import GameObject from "../../../game/gameObject";
import Vector from "../../../helpers/vector";
import WebFileReader from "../../../helpers/webFileReader";
import GeoscapeBorder from "./geoscapeBorder";
import GeoscapeScene from "./geoscapeScene";

export default class GeoscapeCountry extends GameObject {
	private borders: Set<GeoscapeBorder> = new Set()
	private scene: GeoscapeScene

	/**
	 * country's name
	 */
	public name: string

	/**
	 * description of the country
	 */
	public description: string

	/**
	 * compassion score
	 */
	public compassion: number

	/**
	 * isolation score
	 */
	public isolation: number

	/**
	 * social unrest score
	 */
	public unrest: number

	/**
	 * favoring xcom score
	 */
	public favor: number

	/**
	 * position in long/lat
	 */
	public position: Vector

	constructor(game, scene: GeoscapeScene, file: string) {
		super(game)
		this.scene = scene

		new WebFileReader(file).readFile().then((json: string) => {
			let info = JSON.parse(json)

			this.name = info.name || ""
			this.description = info.description || ""
			this.position = new Vector(info.position[0], info.position[1])
			this.compassion = info.startingCompassion || 1
			this.isolation = info.startingIsolation || 0
			this.unrest = info.startingUnrest || 0
			this.favor = info.startingFavor || 0

			for(let border of info.borders) {
				let output = []
				for(let coordinate of border) {
					output.push(GeoscapeScene.longLatToSpherical(coordinate[0], coordinate[1]))
				}
				this.borders.add(new GeoscapeBorder(game, this.scene, this, output))
			}
		})
	}

	public select() {

	}

	public deselect() {

	}
}