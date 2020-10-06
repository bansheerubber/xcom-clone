import { RGBColor } from "../../helpers/color";
import Sprite from "../sprite";
import Game from "../../game/game";
import Vector from "../../helpers/vector";
import * as PIXI from "pixi.js";
import MovingPhysical from "../movingPhysical";
import Emitter from "./emitter";
import Range from "../../helpers/range";
import Camera from "../camera";

function interpolateNumber(number1: number, number2: number, percent: number): number {
	return (number1 * (1 - percent)) + number2 * percent
}

// how a keyframe works is you assign different attributes of the particle here. if a value is defined in one keyframe and not defined in the subsequent keyframe, then the value of the previous keyframe will be used 
export interface ParticleKey {
	scale?: number | Range
	acceleration?: number | Range
	spin?: number | Range
	color?: RGBColor
	time: number // measured in miliseconds
}

// backend version the ParticleKeys turn into eventually
interface ParticleKeyBackend {
	values: any[]

}

enum ParticleKeyNames {
	scale,
	acceleration,
	spin,
	color,
	time,
}

export default class Particle extends Sprite implements MovingPhysical {
	public static keyframes: ParticleKey[] = [] // the keyframes of the particle
	public blendMode: PIXI.BLEND_MODES = PIXI.BLEND_MODES.ADD
	public image: string // the image source of the particle
	private velocity: Vector
	public owner: Emitter
	public cameras: Camera[] = []

	protected timeAlive: number = 0
	protected seed: number = Range.getRandomInt(0, 100000)

	// stores values of the keyframes, indexed by their enums
	protected static backendKeyframes: any[][] = []
	// stores a bunch of values per keyframe value that shows the last time the paticular value was mentioned in a keyframe
	protected static jumpTables: number[][] = []
	protected static keyframeSeeds: number[] = []
	protected static particleInterpreted: boolean = false

	private textureSet: boolean = false
	private static interpolationMap = {
		[ParticleKeyNames.scale]: interpolateNumber,
		[ParticleKeyNames.acceleration]: interpolateNumber,
		[ParticleKeyNames.spin]: interpolateNumber,
		[ParticleKeyNames.color]: RGBColor.interpolate,
	}
	private static defaultValues = {
		[ParticleKeyNames.scale]: 1,
		[ParticleKeyNames.acceleration]: 0,
		[ParticleKeyNames.spin]: 0,
		[ParticleKeyNames.color]: RGBColor.WHITE,
	}



	constructor(game: Game, position: Vector, velocity: Vector, owner?: Emitter) {
		super(game, undefined)

		this.setPosition(position)
		this.velocity = velocity

		this.sprite.anchor.x = 0.5
		this.sprite.anchor.y = 0.5

		this.owner = owner

		if(!this.constructor["particleInterpreted"]) {
			this.constructor["createBackendKeyframes"]()
			this.constructor["createJumpTables"]()
			this.constructor["particleInterpreted"] = true
		}
	}

	public tick(deltaTime: number): void {
		super.tick(deltaTime)

		if(!this.textureSet) {
			this.texture = this.image
			this.textureSet = true
		}

		let currentKey = this.getCurrentKey()

		// apply velocity
		this.setPosition(this.getPosition().add(this.velocity.mul_(deltaTime)))

		// if we don't have a current key, then destroy the particlre
		if(currentKey == -1) {
			this.destroy()
		}
		else {
			let percent = this.getCurrentKeyframePercent(currentKey)
			
			let scaleInterpolation = this.interpolateProperty<number>(currentKey, ParticleKeyNames.scale, percent)
			this.setScale(this.getScale().set(scaleInterpolation, scaleInterpolation))

			// apply the tint color
			let color = this.interpolateProperty<RGBColor>(currentKey, ParticleKeyNames.color, percent)
			this.tint = color
			this.opacity = color.a

			// calculate then apply acceleration
			let acceleration = this.interpolateProperty<number>(currentKey, ParticleKeyNames.acceleration, percent)
			if(acceleration != 0) {
				this.velocity.add(this.velocity.mul_(acceleration * deltaTime))	
			}

			// calculate then apply spin
			let spin = this.interpolateProperty<number>(currentKey, ParticleKeyNames.spin, percent)
			this.rotation += spin * deltaTime
		}

		this.timeAlive += deltaTime
	}

	// tries to interpolate a given property
	private interpolateProperty<T>(currentKey: number, propertyKey: ParticleKeyNames, percent: number): T {
		let currentValue = this.processRange<T>(currentKey, propertyKey)
		let lastValue = this.getLastInstanceOf<T>(currentKey, propertyKey)
		
		// if we have a current value defined, there's a chance we can interpolate
		if(currentValue !== undefined) {
			// if our last value is undefined, we can't really do any inteprolation. instead, just return the current value
			if(lastValue === undefined) {
				return currentValue
			}
			// actually interpolate now
			else {
				return Particle.interpolate<T>(lastValue, currentValue, percent, Particle.interpolationMap[propertyKey])
			}
		}
		// if our last value is defined but our current value is not defined, use the last value for this property
		else if(lastValue !== undefined) {
			return lastValue
		}
		// if we found absolutely nothing, return the default value for the property just so we can return something
		else {
			return Particle.defaultValues[propertyKey]
		}
	}

	// interpolates between two values
	private static interpolate<T>(value1: T, value2: T, percent: number, interpolationFunction: (v1: T, v2: T, p: number) => T): T {
		return interpolationFunction.apply(null, [value1, value2, percent])
	}

	// finds the last instance of a property name from a keyframe
	private getLastInstanceOf<T>(currentKey: number, propertyKey: ParticleKeyNames): T {
		let lastIndex = this.getStaticJumpTables()[propertyKey][currentKey]
		return this.processRange<T>(lastIndex, propertyKey)
	}

	private processRange<T>(key: number, propertyKey: ParticleKeyNames): T {
		let value: T | Range = this.getStaticKeyframes()[key][propertyKey]
		if(value instanceof Range) {
			return value.getRandomDec(this.getRandomSeed(key)) as unknown as T
		}
		else {
			return value
		}
	}

	// gets the current key based off of how much time has been elapsed
	private getCurrentKey(): number {
		let timeAlive = this.timeAlive * 1000
		let staticKeyFrames = this.getStaticKeyframes()
		for(let i = 0; i < staticKeyFrames.length; i++) {
			let key = staticKeyFrames[i]
			if(timeAlive < key[ParticleKeyNames.time]) {
				return i
			}
		}
		return -1
	}

	// gets how completed our current keyframe is
	private getCurrentKeyframePercent(currentKey: number): number {
		let staticKeyFrames = this.getStaticKeyframes()
		
		let startTime = staticKeyFrames[currentKey - 1][ParticleKeyNames.time]
		let endTime = staticKeyFrames[currentKey][ParticleKeyNames.time]
		let percent =  ((this.timeAlive * 1000) - startTime) / (endTime - startTime)
		return percent > 1 ? 1 : percent
	}

	private getRandomSeed(currentKey: number): number {
		return this.getStaticKeyframeSeeds()[currentKey] + this.seed
	}

	private getStaticKeyframes(): any[][] {
		return (<any>this.constructor).backendKeyframes
	}

	private getStaticJumpTables(): any[][] {
		return (<any>this.constructor).jumpTables
	}

	private getStaticKeyframeSeeds(): any[] {
		return (<any>this.constructor).keyframeSeeds
	}

	public static createBackendKeyframes(): void {
		for(let i = 0; i < this.keyframes.length; i++) {
			let keyframe = this.keyframes[i]

			this.backendKeyframes[i] = []
			for(let key in keyframe) {
				this.backendKeyframes[i][ParticleKeyNames[key]] = keyframe[key] 
			}

			this.keyframeSeeds[i] = Range.getRandomInt(0, 100000)
		}
	}

	public static createJumpTables(): void {
		for(let i = 0; i < this.backendKeyframes.length; i++) {
			let array = this.backendKeyframes[i]
			for(let keyframeValueIndex = 0; keyframeValueIndex < array.length; keyframeValueIndex++) {
				if(this.jumpTables[keyframeValueIndex] === undefined) {
					this.jumpTables[keyframeValueIndex] = []
				}

				if(this.jumpTables[keyframeValueIndex][i] == undefined) {
					this.jumpTables[keyframeValueIndex][i] = this.jumpTables[keyframeValueIndex][i - 1]

					if(this.jumpTables[keyframeValueIndex][i] === undefined) {
						this.jumpTables[keyframeValueIndex][i] = 0
					}
				}

				if(array[keyframeValueIndex] !== undefined) {
					this.jumpTables[keyframeValueIndex][i + 1] = i
				}
			}
		}
	}

	public destroy(): void {
		super.destroy()

		if(this.owner) {
			this.owner.aliveParticles.splice(this.owner.aliveParticles.indexOf(this), 1)
		}
	}

	public setVelocity(input: Vector): void {
		this.velocity.set(input.x, input.y)
	}

	public getVelocity(): Vector {
		return this.velocity
	}
}