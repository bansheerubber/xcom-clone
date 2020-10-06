import Random from "./random";

export default class Range {
	public min: number = 0
	public max: number = 0


	
	constructor(min: number, max: number) {
		this.min = min
		this.max = max
	}

	/**
	 * gets a random integer within the range
	 * @param seed
	 */
	public getRandomInt(seed?: number): number {
		let min = Math.ceil(this.min)
		let max = Math.floor(this.max)
		
		if(seed) {
			Random.seed = seed
		}
		let value = Math.floor(Random.random() * (max - min + 1)) + min
		return value
	}

	/**
	 * gets a random decimal within the range
	 * @param seed
	 */
	public getRandomDec(seed?: number): number {
		if(seed) {
			Random.seed = seed
		}
		let value = Random.random() * (this.max - this.min) + this.min
		return value
	}

	/**
	 * gets a random integer within the range
	 * @param min
	 * @param max
	 */
	public static getRandomInt(min: number, max: number): number {
		min = Math.ceil(min)
		max = Math.floor(max)
		return Math.floor(Math.random() * (max - min + 1)) + min
	}

	/**
	 * gets a random decimal within the range
	 * @param min
	 * @param max
	 */
	public static getRandomDec(min: number, max: number): number {
		return Math.random() * (max - min) + min
	}
}