import * as THREE from "three";
import GameObject from "../../../game/gameObject";
import Vector from "../../../helpers/vector";
import Vector3d from "../../../helpers/vector3d";
import GeoscapeCountry from "./geoscapeCountry";
import GeoscapeScene from "./geoscapeScene";

function angleBetween(phi1, theta1, phi2, theta2, radius) {
	let v1 = Vector3d.getTempVector(50).set(
		Math.sin(theta1) * Math.cos(phi1) * radius,
		Math.cos(theta1) * radius,
		Math.sin(theta1) * Math.sin(phi1) * radius,
	)

	let v2 = Vector3d.getTempVector(51).set(
		Math.sin(theta2) * Math.cos(phi2) * radius,
		Math.cos(theta2) * radius,
		Math.sin(theta2) * Math.sin(phi2) * radius,
	)

	let k = v1.cross_(v2).unit()
	return Math.acos(
		v1.dot(v2) / (v1.length() * v2.length())
	)
}

function spherp(phi1, theta1, phi2, theta2, radius, step): Vector3d {
	let v1 = Vector3d.getTempVector(50).set(
		Math.sin(theta1) * Math.cos(phi1) * radius,
		Math.cos(theta1) * radius,
		Math.sin(theta1) * Math.sin(phi1) * radius,
	)

	let v2 = Vector3d.getTempVector(51).set(
		Math.sin(theta2) * Math.cos(phi2) * radius,
		Math.cos(theta2) * radius,
		Math.sin(theta2) * Math.sin(phi2) * radius,
	)

	let k = v1.cross_(v2).unit()
	let angle = Math.acos(
		v1.dot(v2) / (v1.length() * v2.length())
	)

	// https://bansheerubber.com/i/f/66FXy.png
	let interpolatedAngle = Math.min(angle, step)
	return v1.mul_(
			Math.cos(interpolatedAngle)
		)
		.add(
			k.cross_(v1).mul(
				Math.sin(interpolatedAngle)
			)
		)
		.add(
			k.mul_(
				k.dot(v1) * (1 - Math.cos(interpolatedAngle))
			)
		)
}

export default class GeoscapeBorder extends GameObject {
	private scene: GeoscapeScene
	private geometry = new THREE.BufferGeometry()
	private positionsBuffer
	private points: Vector[]
	public readonly country: GeoscapeCountry
	public line: THREE.Line
	
	constructor(game, scene: GeoscapeScene, country: GeoscapeCountry, points: Vector[]) {
		super(game)

		this.country = country
		this.points = points

		if(points.length < 2) {
			throw new Error("Cannot create line from array of length less than 2")
		}

		let array = []
		let radius = GeoscapeScene.RADIUS
		for(let i = 1; i < points.length; i++) {
			let lastPoint = points[i - 1]
			let nextPoint = points[i]

			let step = 0.1
			let angle = angleBetween(lastPoint.x, lastPoint.y, nextPoint.x, nextPoint.y, radius)
			for(let j = 0; j <= angle; j+= step) {
				let vector = spherp(lastPoint.x, lastPoint.y, nextPoint.x, nextPoint.y, radius, j)
				array.push(vector.x)
				array.push(vector.y)
				array.push(vector.z)
			}

			let vector = spherp(lastPoint.x, lastPoint.y, nextPoint.x, nextPoint.y, radius, 1)
			array.push(vector.x)
			array.push(vector.y)
			array.push(vector.z)
		}

		let vector = GeoscapeScene.sphericalToCartesian(points[0].x, points[0].y, radius)
		array.push(vector.x)
		array.push(vector.y)
		array.push(vector.z)

		console.log((array.length / 3) + " points")

		this.positionsBuffer = new Float32Array(array.length)
		this.positionsBuffer.set(array, 0)

		this.scene = scene
		this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positionsBuffer, 3))
		this.geometry.setDrawRange(0, array.length)

		this.line = new THREE.Line(
			this.geometry, 
			new THREE.LineBasicMaterial({
					color: 0xC9C9C9,
					linewidth: 2
				}
			)
		)

		this.scene.addBorder(this)
	}

	public intersects(phi: number, theta: number): boolean {
		// loop through all points
		let time = performance.now()
		let count = 0
		for(let i = 1; i < this.points.length; i++) {
			let lastPoint = this.points[i - 1]
			let point = this.points[i]

			if(
				phi < lastPoint.x && phi < point.x
				&& theta > Math.min(lastPoint.y, point.y) && theta < Math.max(lastPoint.y, point.y)
			) {
				count++
			}
		}

		let lastPoint = this.points[this.points.length - 1]
		let point = this.points[0]

		if(
			phi < lastPoint.x && phi < point.x
			&& theta > Math.min(lastPoint.y, point.y) && theta < Math.max(lastPoint.y, point.y)
		) {
			count++
		}

		return (count % 2) == 1
	}
}