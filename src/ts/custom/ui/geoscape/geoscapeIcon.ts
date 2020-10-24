import * as THREE from "three";
import GameObject from "../../../game/gameObject";
import clamp from "../../../helpers/clamp";
import GeoscapeScene from "./geoscapeScene";

export default class GeoscapeIcon extends GameObject {
	public sprite: THREE.Sprite
	protected geoscape: GeoscapeScene
	private _longitude: number = 0
	private _latitude: number = 0
	
	constructor(game, geoscape: GeoscapeScene, icon: string = "./data/egg.png") {
		super(game)

		this.geoscape = geoscape

		let spriteMap = new THREE.TextureLoader().load(icon)
		let spriteMaterial = new THREE.SpriteMaterial({
			map: spriteMap,
		})
		this.sprite = new THREE.Sprite(spriteMaterial)
		this.updatePosition()
		geoscape.addIcon(this)
	}

	/**
	 * ranges from -180 to 180 degrees
	 */
	set longitude(longitude: number) {
		this._longitude = -longitude
		this.updatePosition()
	}

	/**
	 * ranges from -180 to 180 degrees
	 */
	get longitude(): number {
		return this._longitude
	}

	/**
	 * ranges from -90 to 90 degrees
	 */
	set latitude(latitude: number) {
		this._latitude = clamp(latitude, -90, 90)
		this.updatePosition()
	}

	/**
	 * ranges from -90 to 90 degrees
	 */
	get latitude(): number {
		return this._latitude
	}

	public onClick() {
		
	}

	public onDoubleClick() {
		
	}

	public tick(deltaTime: number) {
		super.tick(deltaTime)

		this.sprite.scale.set(1 / this.geoscape.zoom, 1 / this.geoscape.zoom, 1 / this.geoscape.zoom)
	}

	private updatePosition() {
		let theta = -(Math.PI / 180) * this.latitude + Math.PI / 2
		let phi = (Math.PI / 180) * this.longitude
		let radius = GeoscapeScene.RADIUS + 0.5
		this.sprite.position.set(
			radius * Math.sin(theta) * Math.cos(phi),
			radius * Math.cos(theta),
			radius * Math.sin(theta) * Math.sin(phi)
		)
	}
}