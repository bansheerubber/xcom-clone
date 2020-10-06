import Particle from "./particle";
import Range from "../../helpers/range";
import Physical from "../physical";
import Vector from "../../helpers/vector";
import GameObject from "../../game/gameObject";
import Game from "../../game/game";
import Rotation from "../../helpers/rotation";
import Camera from "../camera";

type ParticleClass = { new(game: Game, position: Vector, velocity: Vector, owner?: Emitter): Particle }

export default class Emitter extends GameObject implements Physical {
	private position: Vector = new Vector(0, 0)
	private scale: Vector = new Vector(1, 1)
	public rotation: number = 0
	public cameras: Camera[] = []
	
	// the list of classes that are created by this emitter class. they are randomly selected per emission
	public particleClasses: ParticleClass[]
	public aliveParticles: Particle[] = []
	// theta ranges from [0, 2pi)
	public theta: Range | number
	// we emit one particle every x ms. cannot be lower than 1
	public emissionTime: Range | number
	// the speed the particles take on when they're emitted
	public particleSpeed: Range | number
	// the physical offset of the particles
	public particleOffset: Range | number = 0

	// the amount of time that has gone by since we emitted our last particle
	protected particleWait: number = 0
	// the current emission time, could be randomly generated
	protected currentEmissionTime: number = 0
	protected emissionRotation: Rotation = new Rotation()



	constructor(game: Game, position: Vector) {
		super(game)

		this.position = position
		if(typeof this.theta == "number") {
			this.emissionRotation.angle = this.theta
		}
	}

	public tick(deltaTime: number): void {
		let getNewEmissionTime = () => {
			if(this.emissionTime instanceof Range) {
				this.currentEmissionTime = this.emissionTime.getRandomInt()
			}
			else {
				this.currentEmissionTime = this.emissionTime
			}
		}
		
		this.particleWait += deltaTime

		if(this.currentEmissionTime == 0) {
			getNewEmissionTime()
		}

		let newParticleCount = this.particleWait * 1000 / this.currentEmissionTime
		for(let i = 0; i < newParticleCount || i < 5; i++) {
			this.particleWait -= this.currentEmissionTime / 1000

			// get the vector emission direction
			if(this.theta instanceof Range) {
				this.emissionRotation.angle = this.theta.getRandomDec()
			}

			// get the emission speed
			if(this.particleSpeed instanceof Range) {
				var speed = this.particleSpeed.getRandomDec()
			}
			else {
				var speed = this.particleSpeed
			}
			
			let position = new Vector(this.position.x, this.position.y)
			// get the particle offset
			if(this.particleOffset instanceof Range) {
				var offset = this.particleOffset.getRandomDec()
			}
			else {
				var offset = this.particleOffset
			}

			position.add(this.emissionRotation.vector.mul_(offset))

			let randomIndex = Range.getRandomInt(0, this.particleClasses.length - 1)
			// create the new particle
			let particle = new this.particleClasses[randomIndex](this.game, position, this.emissionRotation.vector.mul_(speed), this)
			this.aliveParticles.push(particle)

			getNewEmissionTime()
		}
	}

	public setPosition(input: Vector): void {
		this.position.set(input.x, input.y)
	}

	public getPosition(): Vector {
		return this.position
	}

	public setScale(input: Vector): void {
		this.scale.set(input.x, input.y)
	}

	public getScale(): Vector {
		return this.scale
	}
}