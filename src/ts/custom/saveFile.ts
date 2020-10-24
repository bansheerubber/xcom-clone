import GameObject from "../game/gameObject";
import BinaryFileReader from "../helpers/binaryFileReader";
import BinaryFileWriter from "../helpers/binaryFileWriter";

export default class SaveFile extends GameObject {
	public static HEADER: string = "XCOM"
	public static VERSION: number = 1
	
	/**
	 * store for misc values that we set over the course of the game. holds unstructured things like alien commission name, general name, etc
	 */
	private miscValues: {
		[index: string]: string
	} = {}
	
	constructor(game) {
		super(game)
	}

	public setMiscValue(key: string, value: string) {
		this.miscValues[key] = value
	}

	public getMiscValue(key: string): string {
		return this.miscValues[key]
	}

	/**
	 * replaces values from input string with values we've saved
	 */
	public replace(input: string) {
		for(let match of input.matchAll(/(?<=%%)[a-zA-Z0-9_]+(?=%%)/g)) {
			input = input.replace(`%%${match[0]}%%`, this.getMiscValue(match[0]))
		}
		return input
	}

	public save() {
		let file = new BinaryFileWriter("save.egg")
		file.writeString("XCOM") // write special header for server verification purposes
		file.writeInt16(SaveFile.VERSION) // write version

		// write misc data
		file.writeInt16(Object.getOwnPropertyNames(this.miscValues).length)
		for(let name of Object.getOwnPropertyNames(this.miscValues)) {
			file.writeString(name)
			file.writeString(this.miscValues[name])
		}

		file.saveFile(9) // save with maximum compression
	}

	public async load(fileName: string) {
		let file = new BinaryFileReader(fileName)
		await file.readFile()

		let header = file.readString()
		if(header != SaveFile.HEADER) {
			throw new Error(`Incorrect game save file header, file provided '${header}'`)
		}

		let version = file.readInt16()
		if(version != SaveFile.VERSION) {
			throw new Error(`Incorrect game save file version, file provided v${version} but expected v${SaveFile.VERSION}`)
		}

		// read in misc values
		let count = file.readInt16()
		for(let i = 0; i < count; i++) {
			let key = file.readString()
			let value = file.readString()
			this.setMiscValue(key, value)
		}
	}
}