export default class Random {
	/**
	 * returns a random number from 0-1
	 */
	public static random: () => number
	private static _seed: number
	
	static set seed(seed: number) {
		this.random = ()=>((seed=Math.imul(1597334677,seed))>>>0)/2**32 // https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
		this.random()

		this._seed = seed
	}

	static get seed(): number {
		return this._seed
	}
}

Random.seed = Math.random() * 100000 | 0