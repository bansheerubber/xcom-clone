import * as pako from "pako"
import saveAs from "./filesave"
const fs = require("fs")

export default class BinaryFileWriter {
	private fileName: string = ""
	private bytes: number[] = []

	
	
	constructor(fileName: string) {
		this.fileName = fileName
	}

	/**
	 * saves the file based on if we're the client or not
	 * @param compressionLevel
	 */
	public saveFile(compressionLevel: number): void {
		if(fs) {
			
		}
		// download the file if we're the client
		else {
			let compressed = pako.deflate(this.bytes, {
				level: compressionLevel
			})
			let save = new Uint8Array(compressed.length + 1)
			save.set([compressionLevel], 0)
			save.set(compressed, 1)
			
			saveAs(new Blob([save], {
				type: "application/octet-stream"
			}), this.fileName.substring(this.fileName.lastIndexOf("/") + 1, this.fileName.length));
		}
	}

	/**
	 * writes a byte to our bytes array
	 * @param byte 
	 */
	public writeByte(byte: number): void {
		this.bytes.push(byte)
	}

	/**
	 * writes a 32-bit integer to our bytes array
	 * @param int 
	 */
	public writeInt32(int: number): void {
		this.bytes = this.bytes.concat(this.int32ToArray(int))
	}

	/**
	 * writes a 16-bit integer to our bytes array
	 * @param int 
	 */
	public writeInt16(int: number): void {
		this.bytes = this.bytes.concat(this.int16ToArray(int))
	}
	
	/**
	 * write a string to file
	 * @param input 
	 */
	public writeString(input: string): void {
		this.writeInt16(input.length)
		// reads through the string and puts the characters into the bytes array
		for(let i = 0; i < input.length; i++) {
			this.writeByte(input.charCodeAt(i))
		}
	}

	/**
	 * transforms a 32-bit integer into a byte array
	 * @param int
	 */
	private int32ToArray(int: number): number[] {
		let array = []
		for(let i = 3; i >= 0; i--) {
			array.push((int >> 8 * i) & 0xFF)
		}
		return array
	}

	/**
	 * transforms a 16-bit integer into a byte array
	 * @param int
	 */
	private int16ToArray(int: number): number[] {
		let array = []
		for(let i = 1; i >= 0; i--) {
			array.push((int >> 8 * i) & 0xFF)
		}
		return array
	}
}