import * as React from "react";
import * as THREE from "three";
import {
	MTLLoader,
	OBJLoader
} from "three-obj-mtl-loader";

// Terracourium
export default class Geoscape extends React.Component {
	private scene: THREE.Scene
	private cameraViewSize = 12
	private camera: THREE.OrthographicCamera = new THREE.OrthographicCamera(
		-this.cameraViewSize,
		this.cameraViewSize,
		this.cameraViewSize,
		-this.cameraViewSize,
		0.1,
		10000
	)
	private ambientLight: THREE.AmbientLight
	private directionalLight: THREE.DirectionalLight
	private loadingManager: THREE.LoadingManager
	private renderer: THREE.WebGLRenderer
	private lastRender: number = 0
	private tick: number = 0
	private geoscape: THREE.Object3D
	
	constructor(props) {
		super(props)

		this.scene = new THREE.Scene()

		this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.3)

		this.setCameraPosition(new THREE.Vector3(-15, 0, 0))
		this.setCameraLookAt(new THREE.Vector3(0, 0, 0))

		this.scene.add(this.camera)
		this.scene.add(this.ambientLight)

		this.loadingManager = new THREE.LoadingManager()

		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: false
		})
		this.renderer.setPixelRatio(1)

		// geoscape water should be 0x3e6086
		this.loadObject("./data/terracournium.mtl", "./data/terracournium.obj").then((object: THREE.Group) => {
			this.geoscape = object

			this.directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8)
			this.directionalLight.position.set(-15, 0, 15)
			this.scene.add(this.directionalLight)
			this.directionalLight.target = this.geoscape
			this.renderGL()
		})

		window.addEventListener("resize", this.onResize.bind(this))
		this.onResize()
	}

	private onResize() {
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		this.updateCameraBounds()
	}

	public render(): JSX.Element {
		return <div className="geoscape" ref={ref => ref.appendChild(this.renderer.domElement)}></div>
	}

	public renderGL(): void {
		let deltaTime = (performance.now() - this.lastRender) / 1000

		this.renderer.render(this.scene, this.camera)
		requestAnimationFrame(this.renderGL.bind(this))

		this.tick += deltaTime

		let day = this.tick / 5
		let phi = day * (Math.PI * 2) // each day is 360 degree rotation
		let theta = (Math.PI / 180) * (90 + Math.cos(day * 2 * Math.PI / 365) * 23.5) // have day/night cycle switch between hemispheres

		this.directionalLight.position.set(
			15 * Math.sin(theta) * Math.cos(phi),
			15 * Math.cos(theta),
			15 * Math.sin(theta) * Math.sin(phi)
		)

		this.lastRender = performance.now()
	}

	private updateCameraBounds() {
		let width = window.innerWidth
		let height = window.innerHeight
		let aspectRatio = width / height
		
		if(height < width) {
			this.camera.left = -this.cameraViewSize * aspectRatio
			this.camera.right = this.cameraViewSize * aspectRatio
			this.camera.top = this.cameraViewSize
			this.camera.bottom = -this.cameraViewSize
		}
		else {
			this.camera.left = -this.cameraViewSize
			this.camera.right = this.cameraViewSize
			this.camera.top = this.cameraViewSize * (height / width)
			this.camera.bottom = -this.cameraViewSize * (height / width)
		}
		this.camera.updateProjectionMatrix()
	}

	private async loadObject(mtlFile: string, file: string): Promise<THREE.Group> {
		let objectLoader = new OBJLoader()
		return new Promise<THREE.Group>((resolve, reject) => {
			let mtlLoader = new MTLLoader()
			mtlLoader.load(mtlFile, (materials) => {
				materials.preload()
				objectLoader.setMaterials(materials)
				objectLoader.load(file, (object: THREE.Group) => {
					this.scene.add(object)
					resolve(object)
				})
			})
		})
	}

	private setCameraLookAt(vector: THREE.Vector3): void {
		this.camera.lookAt(vector)
		this.camera.updateProjectionMatrix()
	}

	private setCameraPosition(position: THREE.Vector3): void {
		this.camera.position.x = position.x
		this.camera.position.y = position.y
		this.camera.position.z = position.z
		this.camera.updateProjectionMatrix()
	}
}