const fs = require("fs")

export default class WebFileReader {
	private fileName: string = ""
	private bytes: Uint8Array
	private byteIndex: number
	
	
	
	constructor(fileName: string) {
		this.fileName = fileName
	}

	/**
	 * reads file using fs if we're the server, XMLHTTPRequest if we're the client
	 */
	public async readFile(): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			if(fs) {
				fs.readFile(this.fileName, (error, data) => {
					if(!error) {
						resolve(data.toString())
					}
					else {
						reject(error)
					}
				})
			}
			else {
				let request = new XMLHttpRequest()
				request.open("GET", this.fileName, true)
				request.responseType = "text"
				
				request.onload = (event) => {
					resolve(request.response)
				}
				
				request.send()
			}
		})
	}
}