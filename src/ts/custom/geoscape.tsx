import * as React from "react";
import * as THREE from "three";

// Terracourium
export default class Geoscape extends React.Component {
	private static width = 500
	private static height = 500
	
	private scene: THREE.Scene
	private camera: THREE.OrthographicCamera = new THREE.OrthographicCamera(
		-Geoscape.width / 20,
		Geoscape.width / 20,
		Geoscape.width / 20,
		-Geoscape.width / 20, 0.1, 10000
	)
	private ambientLight: THREE.AmbientLight
	private loadingManager: THREE.LoadingManager
	private renderer: THREE.WebGLRenderer
	private lastRender: number = 0
	
	constructor(props) {
		super(props)

		this.scene = new THREE.Scene()

		let light = new THREE.PointLight(0xFFFFFF, 1.0)
		light.position.set(-15, 10, 10)
		this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.7)

		this.setCameraPosition(new THREE.Vector3(-15, 0, 0))
		this.setCameraLookAt(new THREE.Vector3(0, 0, 0))

		this.scene.add(this.camera)
		this.scene.add(light)
		this.scene.add(this.ambientLight)

		this.loadingManager = new THREE.LoadingManager()

		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: false
		})
		this.renderer.setPixelRatio(1)
		this.renderer.setSize(Geoscape.width, Geoscape.height)

		let geometry = new THREE.SphereGeometry(10, 32, 32);
		let material = new THREE.MeshLambertMaterial({
			color: 0x3e6086
		});
		let sphere = new THREE.Mesh(geometry, material);
		this.scene.add(sphere)

		this.renderGL()
	}

	public render(): JSX.Element {
		return <div className="geoscape" ref={ref => ref.appendChild(this.renderer.domElement)}></div>
	}

	public renderGL(): void {
		let deltaTime = (performance.now() - this.lastRender) / 1000

		this.renderer.render(this.scene, this.camera)
		requestAnimationFrame(this.renderGL.bind(this))
		
		this.lastRender = performance.now()
	}

	public setCameraLookAt(vector: THREE.Vector3): void {
		this.camera.lookAt(vector)
		this.camera.updateProjectionMatrix()
	}

	public setCameraPosition(position: THREE.Vector3): void {
		this.camera.position.x = position.x
		this.camera.position.y = position.y
		this.camera.position.z = position.z
		this.camera.updateProjectionMatrix()
	}
}