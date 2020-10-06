export class HSVColor {
	private h: number = 0
	private s: number = 0
	private v: number = 0
	private a: number = 0

	

	constructor(h: number, s: number, v: number, a: number = 1) {
		this.h = h
		this.s = s
		this.v = v
		this.a = a
	}

	/**
	 * converts HSV to RGB
	 */
	public toRGB(): RGBColor {
		// do some linear interpolation trickery to find the RGB values based on this.h
		let hR = Math.max(0, Math.min(1, Math.abs(-6 * (this.h - 3 / 6)) - 1))  // max(0, min(1,  |-6 * (h - (3 / 6))| - 1))
		let hG = Math.max(0, Math.min(1, -Math.abs(-6 * (this.h - 2 / 6)) + 2)) // max(0, min(1, -|-6 * (h - (2 / 6))| + 2))
		let hB = Math.max(0, Math.min(1, -Math.abs(-6 * (this.h - 4 / 6)) + 2)) // max(0, min(1, -|-6 * (h - (4 / 6))| + 2))

		// calculate the saturiation modifier. how much color to add to the above calculated colors based on their saturation values
		let ffR = (-Math.abs(6 * (this.s - 3 / 6)) + 2) > 0 ? 1 : 0 // -|6 * (s - (3 / 6))| + 2
		let ffG = (Math.abs(6 * (this.s - 2 / 3)) - 1) > 0 ? 1 : 0  //  |6 * (s - (2 / 6))| - 1
		let ffB = (Math.abs(6 * (this.s - 4 / 6)) - 1) > 0 ? 1 : 0  //  |6 * (s - (4 / 6))| - 1
		// ffR, ffG, and ffB determine when we should apply saturation modifier to the final color. below are the saturation values we add to the final color. if saturation == 0, then we need to add the full amount of color remaining that lets the final color equal 1
		let sR = ((1 - hR) * (1 - this.s)) * ffR // ((1 - hR) * (1 - s)) * ffR
		let sG = ((1 - hG) * (1 - this.s)) * ffG // ((1 - hG) * (1 - s)) * ffG
		let sB = ((1 - hB) * (1 - this.s)) * ffB // ((1 - hB) * (1 - s)) * ffB

		// calculate the final color by adding together the old values and multiplying them by the brightness
		let r = (sR + hR) * this.v
		let g = (sG + hG) * this.v
		let b = (sB + hB) * this.v

		return new RGBColor(r, g, b, this.a)
	}
}

export class RGBColor {
	public r: number = 0
	public g: number = 0
	public b: number = 0
	public a: number = 0

	public static WHITE: RGBColor = new RGBColor(1, 1, 1, 1)
	public static BLACK: RGBColor = new RGBColor(0, 0, 0, 1)
	public static TRANSPARENT: RGBColor = new RGBColor(1, 1, 1, 0)
	
	
	
	constructor(r: number, g: number, b: number, a: number = 1) {
		this.r = r
		this.g = g
		this.b = b
		this.a = a
	}

	/**
	 * converts the color to a number
	 */
	public toHex(): number {
		return Math.floor(this.r * 255) << 16 | Math.floor(this.g * 255) << 8 | Math.floor(this.b * 255) << 0
	}

	/**
	 * converts this to a css color. if a == 1, then it will use the hex. if a < 1, then it will do rgab(r, g, b, a)
	 */
	public toCSSColor(): string {
		if(this.a == 1) {
			return `#${this.toHex().toString(16)}`
		}
		else {
			return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`
		}
	}

	/**
	 * converts RGB to HSV
	 */
	public toHSV(): HSVColor {
		let magic = 2 * Math.sqrt(this.r**2 + this.b**2 + this.g**2 - this.g * this.r - this.b * this.g - this.b * this.r)
		return new HSVColor(Math.atan2(this.b - this.g, Math.sqrt((2 * this.r - this.b - this.g) / 3)),
			magic / (this.r + this.b + this.g + magic),
			(this.r + this.b + this.g + magic) / 3, this.a)
	}

	/**
	 * interpolates between two colors
	 * @param color1 starting color
	 * @param color2 ending color
	 * @param percent how far along to interpolate
	 */
	public static interpolate(color1: RGBColor, color2: RGBColor, percent: number): RGBColor {
		return new RGBColor((color1.r * (1 - percent)) + color2.r * percent, 
			(color1.g * (1 - percent)) + color2.g * percent, 
			(color1.b * (1 - percent)) + color2.b * percent, 
			(color1.a * (1 - percent)) + color2.a * percent)
	}

	/**
	 * create a color from a number or from a CSS color
	 * @param input number or CSS color string
	 */
	public static from(input: number | string): RGBColor {
		if(typeof input == "number") {
			let r = ((input) & (255 << 0)) / (255 << 0)
			let g = ((input) & (255 << 8)) / (255 << 8)
			let b = ((input) & (255 << 16)) / (255 << 16)
			return new RGBColor(r, g, b, 1)
		}
		else {
			if(input.indexOf("#") != -1) {
				if(input.length > 4) {
					let numberString = input.substring(1, input.length)
					return this.from(parseInt(numberString, 16))
				}
				else {
					let numberString = input.substring(1, input.length)
					return this.from(parseInt(numberString + numberString, 16))
				}
			}
			else {
				let match = input.match(/[0-9\.]+/g)
				let r = parseInt(match[0]) / 255
				let g = parseInt(match[1]) / 255
				let b = parseInt(match[2]) / 255
				let a = parseInt(match[3])
				return new RGBColor(r, g, b, isNaN(a) ? 1 : a)
			}
		}
	}
}