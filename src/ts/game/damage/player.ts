import { Damageable } from "./damageable";
import MovingPhysical from "../../render/movingPhysical";
import Vector from "../../helpers/vector";
import RemoteObject from "../../network/remoteObject";
import Sprite from "../../render/sprite";
import Game from "../game";
import clamp from "../../helpers/clamp";
import Camera from "../../render/camera";
import Collidable from "../../collision/collidable";
import CollidableBox from "../../collision/collidableBox";
import Matter = require("matter-js");

export class PlayerMoveOptions {
	acceleration?: number
	speed?: number
	friction?: number
}

export class PlayerMove {
	// the different velocities we have in the different directions. allows for 8 directional movement
	protected movePositiveX: number = 0
	protected moveNegativeX: number = 0
	protected movePositiveY: number = 0
	protected moveNegativeY: number = 0

	protected tempVec: Vector = new Vector()
	protected lastMoveVelocity: Vector = new Vector()

	// whether or not we're moving in a paticular direction
	public isMovingPositiveX: boolean = false
	public isMovingNegativeX: boolean = false
	public isMovingPositiveY: boolean = false
	public isMovingNegativeY: boolean = false

	public acceleration: number = 0 // how fast we accelerate from 0 to moveSpeed, and from moveSpeed to 0
	public speed: number = 0 // how fast the player moves in any direction
	public friction: number = 0

	private positiveXVector: Vector = new Vector(0, 0)
	private negativeXVector: Vector = new Vector(0, 0)
	private positiveYVector: Vector = new Vector(0, 0)
	private negativeYVector: Vector = new Vector(0, 0)



	constructor(options: PlayerMoveOptions) {
		this.acceleration = options.acceleration
		this.speed = options.speed
		this.friction = options.friction
	}

	private updateMoveVectors(): void {
		if(this.isMovingPositiveX) {
			this.positiveXVector.x = 0.2
		}
		else {
			this.positiveXVector.x = 0
		}

		if(this.isMovingNegativeX) {
			this.negativeXVector.x = -0.2
		}
		else {
			this.negativeXVector.x = 0
		}

		if(this.isMovingPositiveY) {
			this.positiveYVector.y = 0.2
		}
		else {
			this.positiveYVector.y = 0
		}

		if(this.isMovingNegativeY) {
			this.negativeYVector.y = -0.2
		}
		else {
			this.negativeYVector.y = 0
		}
	}

	private getMoveDirection(): Vector {
		let direction = new Vector(0, 0)

		if(this.isMovingPositiveX) {
			direction.x += 1
		}

		if(this.isMovingNegativeX) {
			direction.x -= 1
		}
		
		if(this.isMovingPositiveY) {
			direction.y += 1
		}

		if(this.isMovingNegativeY) {
			direction.y -= 1
		}

		return direction.unit()
	}

	private getMoveMagnitude(direction: Vector, move: Vector): number {
		return Math.max(direction.dot(move.unit_()), 0)
	}

	public getMoveVelocity(deltaTime: number): Vector {
		this.updateMoveVectors()
		let direction = this.getMoveDirection()

		let combination = new Vector(0, 0)
		combination.add(this.positiveXVector.mul_(this.getMoveMagnitude(direction, this.positiveXVector)))
		combination.add(this.positiveYVector.mul_(this.getMoveMagnitude(direction, this.positiveYVector)))
		combination.add(this.negativeXVector.mul_(this.getMoveMagnitude(direction, this.negativeXVector)))
		combination.add(this.negativeYVector.mul_(this.getMoveMagnitude(direction, this.negativeYVector)))

		return combination
	}

	public getFrictionVelocity(velocity: Vector, deltaTime: number): Vector {
		if(velocity.length() - this.friction * deltaTime > 0) {
			return this.tempVec.set(velocity.x, velocity.y).unit().mul(-this.friction * deltaTime)
		}
		else {
			return this.tempVec.set(velocity.x, velocity.y).mul(-1)
		}
	}
}

export default abstract class Player extends RemoteObject implements Damageable {
	public cameras: Camera[] = []

	public collidable: CollidableBox

	// damageable properties
	public maxHealth: number = 100
	public health: number = this.maxHealth

	// the player's sprite, we manipulate this through tick logic
	protected sprite: Sprite

	// defines how the player is currently moving. we keep track of player velocity/player move velocity separately.
	public move: PlayerMove

	protected tempVec: Vector = new Vector()



	constructor(game: Game, move: PlayerMove) {
		super(game)
		this.move = move
	}

	public tick(deltaTime: number): void {
		super.tick(deltaTime)
		
		// apply move
		let moveVelocity = this.move.getMoveVelocity(deltaTime)
		Matter.Body.applyForce(this.collidable.body, this.collidable.body.position, moveVelocity.toMatter())

		// apply body position
		this.tempVec.x = this.collidable.body.position.x
		this.tempVec.y = this.collidable.body.position.y

		// add onto our velocity
		this.sprite.setPosition(this.tempVec)

		// applying position to cameras
		for(let camera of this.cameras) {
			camera.position.set(this.tempVec.x, this.tempVec.y)
		}
	}

	abstract canDamage(attacker: Damageable): boolean
}