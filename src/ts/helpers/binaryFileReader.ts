import * as pako from "pako"
const fs = require("fs")

export default class BinaryFileReader {
	private fileName: string = ""
	private bytes: Uint8Array
	private byteIndex: number
	
	
	
	constructor(fileName: string) {
		this.fileName = fileName
	}

	/**
	 * reads file using fs if we're the server, XMLHTTPRequest if we're the client
	 */
	public async readFile(): Promise<Uint8Array> {
		return new Promise<Uint8Array>((resolve, reject) => {
			if(fs) {
				fs.readFile(this.fileName, (error, data) => {
					if(!error) {
						this.bytes = new Uint8Array(data)

						// read the first byte to determine compression level (supports levels 0-9. if the first byte == 10, that means there's no compression
						let firstByte = this.bytes[0]
						this.bytes = this.bytes.slice(1, this.bytes.length)
						if(firstByte <= 9) {
							this.bytes = pako.inflate(this.bytes)
						}

						this.byteIndex = 0
						resolve(this.bytes)
					}
					else {
						reject(error)
					}
				})
			}
			else {
				let request = new XMLHttpRequest()
				request.open("GET", this.fileName, true)
				request.responseType = "blob"
				
				request.onload = (event) => {
					let fileReader = new FileReader()
					fileReader.addEventListener("loadend", () => {
						let arrayBuffer: any = fileReader.result
						this.bytes = new Uint8Array(arrayBuffer)

						// read the first byte to determine compression level (supports levels 0-9. if the first byte == 10, that means there's no compression
						let firstByte = this.bytes[0]
						this.bytes = this.bytes.slice(1, this.bytes.length)
						if(firstByte <= 9) {
							this.bytes = pako.inflate(this.bytes)
						}

						this.byteIndex = 0
						resolve(this.bytes)
					})
					fileReader.readAsArrayBuffer(request.response)
				}
				
				request.send()
			}
		})
	}

	/**
	 * whether or not we're at the end of the file
	 */
	public isEOF(): boolean {
		return this.byteIndex >= this.bytes.length
	}
	
	/**
	 * reads a byte from our data
	 */
	public readByte(): number {
		this.byteIndex++
		return this.bytes[this.byteIndex - 1]
	}
	
	/**
	 * reads a 32 bit number from our bytes
	 */
	public readInt(): number {
		this.byteIndex += 4
		return this.bytes[this.byteIndex - 4] << 24 | this.bytes[this.byteIndex - 3] << 16 | this.bytes[this.byteIndex - 2] << 8 | this.bytes[this.byteIndex - 1]
	}
	
	/**
	 * reads an aomunt of bytes into a new array
	 * @param amount
	 */
	public readBytesIntoArray(amount): number[] {
		let array = []
		for(let i = 0; i < amount; i++) {
			array.push(this.readByte())
		}
		return array
	}
	
	// reads a character from our bytes array

	/**
	 * @return a character from our bytes array
	 */
	public readChar(): string {
		return String.fromCharCode(this.readByte())
	}
	
	/**
	 * reads the first int, and treats that as a string length. reads that amount bytes forwards to construct a string
	 */
	public readString(): string {
		let length = this.readInt()
		let output = ""
		for(let i = 0; i < length; i++) {
			output += this.readChar()
		}
		return output
	}
}