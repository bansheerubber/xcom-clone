import * as THREE from "three";
import GameObject from "../../../game/gameObject";
import Vector from "../../../helpers/vector";
import Vector3d from "../../../helpers/vector3d";
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

export default class GeoscapeLine extends GameObject {
	private scene: GeoscapeScene
	private geometry = new THREE.BufferGeometry()
	private positionsBuffer
	public line: THREE.Line
	
	constructor(game, scene: GeoscapeScene, points: Vector[]) {
		super(game)

		if(points.length < 2) {
			throw new Error("Cannot create line from array of length less than 2")
		}

		let array = []
		for(let i = 1; i < points.length; i++) {
			let lastPoint = points[i - 1]
			let nextPoint = points[i]

			let radius = GeoscapeScene.GEOSCAPE_RADIUS + 0.02
			let step = 0.1
			let angle = angleBetween(lastPoint.x, lastPoint.y, nextPoint.x, nextPoint.y, radius)
			console.log(angle)
			for(let j = 0; j <= angle + step; j+= step) {
				let vector = spherp(lastPoint.x, lastPoint.y, nextPoint.x, nextPoint.y, radius, j)
				array.push(vector.x)
				array.push(vector.y)
				array.push(vector.z)
			}

			// let step = 0.1
			// for(let j = 0; j <= distance + step; j += step) {
			// 	let interpolation = lastPoint.lerpUnit(nextPoint, j)
			// 	let position = GeoscapeScene.sphericalToCartesian(interpolation.x, interpolation.y, GeoscapeScene.GEOSCAPE_RADIUS + 0.02)
			// 	array.push(position.x)
			// 	array.push(position.y)
			// 	array.push(position.z)
			// }
		}

		console.log((array.length / 3) + " points")

		this.positionsBuffer = new Float32Array(array.length)
		this.positionsBuffer.set(array, 0)

		this.scene = scene
		this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positionsBuffer, 3))
		this.geometry.setDrawRange(0, array.length)

		this.line = new THREE.Line(
			this.geometry, 
			new THREE.LineBasicMaterial({
					color: 0xff0000,
					linewidth: 2
				}
			)
		)

		this.scene.addLine(this)
	}
}