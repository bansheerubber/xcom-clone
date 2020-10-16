import * as THREE from "three";
import {
	GLTFLoader
} from "three/examples/jsm/loaders/GLTFLoader";
import Game from "../../../game/game";
import GameObject from "../../../game/gameObject";
import { Keybind } from "../../../game/keybinds";
import clamp from "../../../helpers/clamp";
import Vector from "../../../helpers/vector";
import { SmoothVectorInterpolation } from "../../../helpers/vectorInterpolation";
import GeoscapeIcon from "./geoscapeIcon";
import GeoscapeLine from "./geoscapeLine";

export default class GeoscapeScene extends GameObject {
	public static GEOSCAPE_RADIUS: number = 10

	public move: {
		up: number,
		down: number,
		right: number,
		left: number,
	} = {
		up: 0,
		down: 0,
		right: 0,
		left: 0
	}
	public cameraSpeed: number = 1.75
	
	public renderer: THREE.WebGLRenderer
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
	public zoom: number = 1
	private ambientLight: THREE.AmbientLight
	private directionalLight: THREE.DirectionalLight
	private loadingManager: THREE.LoadingManager
	private lastRender: number = 0
	private tickCount: number = 0
	private geoscape: THREE.Object3D
	private _cameraPhi: number = 0
	private _cameraTheta: number = Math.PI / 2
	private icons: Map<THREE.Sprite, GeoscapeIcon> = new Map()
	private lines: Map<THREE.Line, GeoscapeLine> = new Map()
	private interpolation: SmoothVectorInterpolation
	private raycaster: THREE.Raycaster
	private pointer: GeoscapeIcon
	private isDragging: boolean = false
	
	constructor(game: Game) {
		super(game)
		this.scene = new THREE.Scene()

		this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.3)

		this.setCameraPosition(new THREE.Vector3(-15, 0, 0))
		this.setCameraLookAt(new THREE.Vector3(0, 0, 0))

		this.scene.add(this.camera)
		this.scene.add(this.ambientLight)

		this.pointer = new GeoscapeIcon(this.game, this)

		this.loadingManager = new THREE.LoadingManager()

		this.renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: false
		})
		this.renderer.setPixelRatio(1)
		this.renderer.outputEncoding = THREE.sRGBEncoding

		this.raycaster = new THREE.Raycaster();

		// geoscape water should be 0x3e6086
		this.loadGLTFObject("./data/", "terracournium.glb").then((object: THREE.Group) => {
			this.geoscape = object

			this.scene.add(this.geoscape)

			this.directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8)
			this.directionalLight.position.set(-15, 0, 15)
			this.scene.add(this.directionalLight)
			this.directionalLight.target = this.geoscape
			this.renderGL()
		})

		window.addEventListener("resize", this.onResize.bind(this))

		let sawMovement = false
		let startX = 0
		let startY = 0
		let startPhi = 0
		let startTheta = 0

		new Keybind("mouse0", Keybind.None, "Click Geoscape").down((event: MouseEvent) => {
			this.isDragging = true
			startX = event.x
			startY = event.y
			startPhi = this.cameraPhi
			startTheta = this.cameraTheta
			sawMovement = false
		}).up((event: MouseEvent) => {
			this.isDragging = false

			if(!sawMovement) {
				let mousePosition = new THREE.Vector2()
				mousePosition.x = (event.x / window.innerWidth) * 2 - 1
				mousePosition.y = -(event.y / window.innerHeight) * 2 + 1

				// check for sprites
				this.raycaster.setFromCamera(mousePosition, this.camera);
				let intersects = this.raycaster.intersectObjects(this.scene.children, false)
				if(intersects[0]) {
					this.icons.get(intersects[0].object as THREE.Sprite)?.onClick() // handle clicking icons
					return
				}
				
				// check for earth
				this.raycaster.setFromCamera(mousePosition, this.camera);
				intersects = this.raycaster.intersectObjects(this.geoscape.children, false)
				if(intersects) {
					let point = intersects[0].point
					let radius = point.length()
					let phi = Math.atan2(point.z, point.x)
					let theta = Math.acos(point.y / radius)

					let latitude = -(theta - Math.PI / 2) / (Math.PI / 180)
					let longitude = -phi / (Math.PI / 180)

					this.onClick(latitude, longitude) // handle clicking the globe
					return
				}
			}
		}).move((event: MouseEvent) => {
			if(this.isDragging && !this.interpolation) {
				this.cameraPhi = startPhi + ((event.x - startX) / 300) / this.zoom
				this.cameraTheta = startTheta + ((startY - event.y) / 300) / this.zoom

				if(
					Math.abs(this.cameraPhi - startPhi) > 0.05
					|| Math.abs(this.cameraTheta - startTheta) > 0.05
				) {
					sawMovement = true
				}
			}
		})

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
			this.zoom = Math.min(2, this.zoom + this.zoom * 0.1)
			this.updateCameraBounds()
		})

		// zoom out the camera with -
		new Keybind("-", Keybind.None, "Zoom Out").down(() => {
			this.zoom = Math.max(0.5, this.zoom + this.zoom * -0.1)
			this.updateCameraBounds()
		})

		new Keybind(" ", Keybind.None, "Zoom Out").down(() => {
			this.goto(0, 0)
		})

		this.onResize()
	}

	set cameraPhi(input: number) {
		this._cameraPhi = input % (Math.PI * 2)
		if(this._cameraPhi < 0) {
			this._cameraPhi += Math.PI * 2
		}
	}

	get cameraPhi(): number {
		return this._cameraPhi
	}

	set cameraTheta(input: number) {
		this._cameraTheta = clamp(
			input,
			Math.PI / 2 - Math.PI / 2 + 0.001,
			Math.PI / 2 + Math.PI / 2 - 0.001
		)
	}

	get cameraTheta(): number {
		return this._cameraTheta
	}

	/**
	 * in degrees
	 */
	get cameraLongitude(): number {
		let longitude = -this.cameraPhi / (Math.PI / 180)
		if(longitude < -180) {
			longitude += 360
		}
		return longitude
	}

	/**
	 * in degrees
	 */
	get cameraLatitude(): number {
		return -(this.cameraTheta - Math.PI / 2) / (Math.PI / 180)
	}

	public static sphericalToCartesian(phi: number, theta: number, radius: number = GeoscapeScene.GEOSCAPE_RADIUS): THREE.Vector3 {
		return new THREE.Vector3(
			radius * Math.sin(theta) * Math.cos(phi),
			radius * Math.cos(theta),
			radius * Math.sin(theta) * Math.sin(phi)
		)
	}

	public static longLatToSpherical(longitude: number, latitude: number): Vector {
		return new Vector(
			-(Math.PI / 180) * longitude,
			Math.PI / 2 - (Math.PI / 180) * latitude
		)
	}

	public goto(longitude: number, latitude: number) {
		this.isDragging = false
		if(this.interpolation) {
			this.interpolation.destroy()
			delete this.interpolation
		}

		let {
			x: endPhi,
			y: endTheta
		} = GeoscapeScene.longLatToSpherical(longitude, latitude)

		let startPhi = this.cameraPhi
		let startTheta = this.cameraTheta

		// take shortest phi path to point
		if(Math.abs(endPhi - startPhi) > Math.PI) {
			if(endPhi - startPhi < 0) {
				startPhi -= Math.PI * 2
			}
			else {
				startPhi += Math.PI * 2
			}
		}
		
		this.interpolation = new SmoothVectorInterpolation(
			this.game,
			new Vector(startPhi, startTheta),
			new Vector(endPhi, endTheta),
			1,
			(input: Vector) => {
				let phi = input.x
				let theta = input.y

				this.cameraPhi = phi
				this.cameraTheta = theta
			},
			() => {
				this.interpolation.destroy()
				delete this.interpolation
			}
		)
	}

	public addIcon(icon: GeoscapeIcon) {
		this.icons.set(icon.sprite, icon)
		this.scene.add(icon.sprite)
	}

	public removeIcon(icon: GeoscapeIcon) {
		this.icons.delete(icon.sprite)
		this.scene.remove(icon.sprite)
	}

	public addLine(line: GeoscapeLine) {
		this.lines.set(line.line, line)
		this.scene.add(line.line)
	}

	public removeLine(line: GeoscapeLine) {
		this.lines.delete(line.line)
		this.scene.remove(line.line)
	}

	private onClick(latitude: number, longitude: number) {
		this.pointer.latitude = latitude
		this.pointer.longitude = longitude
	}

	private onResize() {
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		this.updateCameraBounds()
	}

	public renderGL(): void {
		let deltaTime = (performance.now() - this.lastRender) / 1000

		this.renderer.render(this.scene, this.camera)
		requestAnimationFrame(this.renderGL.bind(this))

		this.tickCount += deltaTime

		let day = this.tickCount / 5
		let phi = day * (Math.PI * 2) // each day is 360 degree rotation
		let theta = (Math.PI / 180) * (90 + Math.cos(day * 2 * Math.PI / 365) * 23.5) // have day/night cycle switch between hemispheres

		this.directionalLight.position.set(
			15 * Math.sin(theta) * Math.cos(phi),
			15 * Math.cos(theta),
			15 * Math.sin(theta) * Math.sin(phi)
		)

		if(!this.interpolation) {
			if(this.move.up) {
				this.cameraTheta = this.cameraTheta - this.cameraSpeed * deltaTime / this.zoom
			}
	
			if(this.move.down) {
				this.cameraTheta = this.cameraTheta + this.cameraSpeed * deltaTime / this.zoom
			}
	
			if(this.move.left) {
				this.cameraPhi = this.cameraPhi + this.cameraSpeed * deltaTime / this.zoom
			}
	
			if(this.move.right) {
				this.cameraPhi = this.cameraPhi - this.cameraSpeed * deltaTime / this.zoom
			}
		}

		this.setCameraPosition(new THREE.Vector3(
			15 * Math.sin(this.cameraTheta) * Math.cos(this.cameraPhi),
			15 * Math.cos(this.cameraTheta),
			15 * Math.sin(this.cameraTheta) * Math.sin(this.cameraPhi)
		))
		this.setCameraLookAt(new THREE.Vector3(0, 0, 0))

		this.lastRender = performance.now()
	}

	private updateCameraBounds() {
		let width = window.innerWidth
		let height = window.innerHeight
		let aspectRatio = width / height
		
		if(height < width) {
			this.camera.left = (-this.cameraViewSize * aspectRatio) / this.zoom
			this.camera.right = (this.cameraViewSize * aspectRatio) / this.zoom
			this.camera.top = (this.cameraViewSize) / this.zoom
			this.camera.bottom = (-this.cameraViewSize) / this.zoom
		}
		else {
			this.camera.left = (-this.cameraViewSize) / this.zoom
			this.camera.right = (this.cameraViewSize) / this.zoom
			this.camera.top = (this.cameraViewSize * (height / width)) / this.zoom
			this.camera.bottom = (-this.cameraViewSize * (height / width)) / this.zoom
		}
		this.camera.updateProjectionMatrix()
	}

	private async loadGLTFObject(dataPath: string, file: string): Promise<THREE.Group> {
		let loader = new GLTFLoader().setPath(dataPath);
		return new Promise<THREE.Group>((resolve, reject) => {
			loader.load(file, (gltf) => {
				resolve(gltf.scene)
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