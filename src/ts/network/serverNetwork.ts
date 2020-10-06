import NetworkBase from "./networkBase";
import Network, { RemoteObjectSend, RemoteObjectReference } from "./network";
import * as fs from "fs"
import Scheduler from "../game/scheduler";
import Game from "../game/game";
import RemoteObject from "./remoteObject";
import Client from "./client";
import { RemoteMethodPayload, RemoteReturnPayload, ServerResolve, ServerRemoteReturn, ServerRemoteReturnCollection, ServerReject } from "./remoteMethod";
import { timingSafeEqual } from "crypto";
const ws = require("ws")
const https = require("https")

// handles the ws server
export class ServerNetworkHost {
	public network: ServerNetwork
	public static port: number = 8329
	public publicIP: string = "N/A"
	public isSecure: boolean = false
	public server: any

	constructor(network: ServerNetwork) {
		this.network = network

		this.listen(ServerNetworkHost.port, "/etc/letsencrypt/live/bansheerubber.com/fullchain.pem", "/etc/letsencrypt/live/bansheerubber.com/privkey.pem")
	}

	public listen(port: number, certificatePath?: string, keyPath?: string): void {
		// if we have valid certification info, then construct partial options
		if(certificatePath && fs.existsSync(certificatePath) // make sure certificate path exists
			&& keyPath && fs.existsSync(keyPath)) { // make sure key path exists

			// create a https server with the different certificates
			const httpsServer = new https.createServer({
				cert: fs.readFileSync(certificatePath),
				key: fs.readFileSync(keyPath),
			})

			var partialOptions: any = {
				server: httpsServer
			}
	
			httpsServer.listen(port)

			this.isSecure = true

			console.log("Secure server is being hosted.")
		}
		else {
			if(certificatePath || keyPath) {
				Scheduler.schedule(0.1, console.error, `Could not find certificate or key files at "${certificatePath}" or "${keyPath}"`)
			}
			
			var partialOptions: any = {
				port: port,
				server: true
			}

			this.isSecure = false
		}

		// combine the partial options into a big option list, then create the server with said options
		let options = Object.assign({
			perMessageDeflate: {
				zlibDeflateOptions: {
					chunkSize: 1024,
					memLevel: 9, // higher the level, higher the compression
					level: 9
				},
				zlibInflateOptions: {
					chunkSize: 15 * 1024
				},
				clientNoContextTakeover: true,
				serverNoContextTakeover: true,
				serverMaxWindowBits: 15, // no clue what this means but turning it up to its maximum allowed value reduced the amount sent to client by like 150% so yeah i'm leaving it at 15
				concurrencyLimit: 10, // imits zlib concurrency for perf.
				threshold: 64 // Size (in bytes) below which messages should not be compressed
			}
		}, partialOptions)

		this.server = new ws.Server(options)

		console.log(`Server listening on port ${port}...`)

		// handle a connection
		this.server.on("connection", (connection: WebSocket, request: any) => {
			// new Client(this.network.game, connection, request)
			this.network.game.gamemode.createClientClass(this.network.game, connection, request)
		})
		
		this.server.on("error", (error) => {
			console.log("connection error", error)
		})
	}
}

// handles the server-sided connection with clients via the websocket
export default class ServerNetwork extends NetworkBase {
	public host: ServerNetworkHost
	public remoteReturns: { [key: number]: ServerRemoteReturn } = {}
	public remoteReturnCollections: { [key: number]: ServerRemoteReturnCollection } = {}

	private remoteReturnCollectionCount: number = 0
	
	
	
	constructor(game: Game) {
		super(game)

		this.host = new ServerNetworkHost(this)
	}

	// generates the remote objects init command, which when parsed by the client will recreate all the remote objects we have here on the server
	public generateRemoteObjectsInit(): RemoteObjectSend[] {
		let array: RemoteObjectSend[] = [] // create an array of objects we will sent
		for(let remoteObject of this.remoteObjectsSet.values()) { // go through all of our remote objects
			if(remoteObject.remoteGroup.autoSend) {
				let remoteObjectReferences: RemoteObjectReference[] = []
				let temp: RemoteObject[]
				if((temp = this.getRemoteClassReferences(remoteObject))) { // get the class references of a paticular object, and create a new array that holds all their remoteIDs
					for(let remoteObject2 of temp) {
						remoteObjectReferences.push({
							remoteGroupID: remoteObject2.remoteGroupID,
							remoteID: remoteObject2.remoteID,
						})
					}
				}
				
				// once everything is completed, stringify the object and put it with its class references
				array.push({
					remoteObjectString: Network.stringifyObject(remoteObject, true),
					remoteObjectReferences,
				})
			}
		}
		// return the final payload
		return array
	}

	public sendRemoteObjectToClients(remoteObject: RemoteObject): void {
		if(remoteObject.remoteGroup.autoSend) {
			for(let client of this.clients.values()) {
				let remoteObjectReferences: RemoteObjectReference[] = []
				let temp: RemoteObject[]
				if((temp = this.getRemoteClassReferences(remoteObject))) { // get the class references of a paticular object, and create a new array that holds all their remoteIDs
					for(let remoteObject of temp) {
						remoteObjectReferences.push({
							remoteGroupID: remoteObject.remoteGroupID,
							remoteID: remoteObject.remoteID,
						})
					}
				}
				
				// once everything is completed, stringify the object and put it with its class references
				client.sendRemoteObject({
					remoteObjectString: Network.stringifyObject(remoteObject, true),
					remoteObjectReferences,
				})
			}
		}
	}

	private createRemoteReturn(collection: ServerRemoteReturnCollection, groupID: number, objectID: number, client: Client): number {
		let object = this.remoteObjects[groupID][objectID]
		let returnID = this.remoteReturnCount
		this.remoteReturns[returnID] = {
			client,
			collection,
			object,
			promise: new Promise<ServerResolve>((resolve, reject) => { // create the promise
				this.remoteResolves[returnID] = (value: any) => {
					// make sure the value is correctly validated
					let remoteMethod = this.remoteObjects[groupID][objectID].getNetworkMetadata().remoteMethods[collection.methodID]
					let validator = Network.validators.get(remoteMethod.validatedReturn)
					if(validator != undefined) {
						let validated = validator.validate(value)

						// reject if we do not have a properly validated return
						if(validated == false) {
							console.error(`Remote Return: Failed to validate a return ${remoteMethod.validatedReturn.name} for method ${remoteMethod.name}`)
							client.destroy()
							return reject({
								client,
								error: "unvalidated",
							} as ServerReject)
						}
					}
					
					// tell the collection we've resolved this
					collection.resolveRemoteReturn({
						client,
						value,
					})

					// resolve the value
					resolve({
						client,
						value,
					})
				}
				this.remoteRejects[returnID] = (error: any) => {
					// tell the collection we've rejected
					collection.rejectRemoteReturn({
						client,
						error,
					})

					// reject the value
					reject({
						client,
						error,
					})
				}

				setTimeout(() => {
					this.rejectRemoteReturn(returnID, "timeout")
				}, 2000)
			}),
		}

		this.remoteReturns[returnID].promise.catch((error) => {
			console.error(`Remote return error: ${error}`)
		})

		this.remoteReturnCount++

		return returnID
	}

	public requestClientMethod(remoteObject: RemoteObject, groupID: number, objectID: number, methodID: number, onlyCallOnOwner: boolean, args: any[]): void {
		if(onlyCallOnOwner == false) {
			var collection = new ServerRemoteReturnCollection(this, this.remoteReturnCollectionCount, methodID, this.clients.size) // create a promise object so we can do remote returns

			for(let client of this.clients.values()) {
				let returnID = this.createRemoteReturn(collection, groupID, objectID, client)
				client.sendRemoteMethod(groupID, objectID, methodID, returnID, args)
			}
		}
		else { // only call the method on the owner of the object
			var collection = new ServerRemoteReturnCollection(this, this.remoteReturnCollectionCount, methodID, 1) // create a promise object so we can do remote returns
			
			let client = remoteObject.owner
			if(client instanceof Client) {
				let returnID = this.createRemoteReturn(collection, groupID, objectID, client)
				client.sendRemoteMethod(groupID, objectID, methodID, returnID, args)
			}
		}

		this.remoteReturnCollections[this.remoteReturnCollectionCount] = collection
		this.remoteReturnCollectionCount++
	}

	// executes a remote method on the server side
	public executeRemoteMethod(payload: RemoteMethodPayload, client: Client): void {
		let { groupID, objectID, methodID, returnID, args, } = payload

		if(this.remoteObjects[groupID] && this.remoteObjects[groupID][objectID]) {
			let object = this.remoteObjects[groupID][objectID]
			// make sure we're the server and we have an actual remote method to call in the first place
			if(this.game.isServer && object.getNetworkMetadata().remoteMethods[methodID]) {
				let data = object.getNetworkMetadata().remoteMethods[methodID].receiveFromClient(object, client, ...args)
				client.sendRemoteReturn(returnID, data)
			}
		}
	}

	public handleRemoteReturn(payload: RemoteReturnPayload, client: Client): void {
		let remoteReturn = this.remoteReturns[payload.id]
		if(remoteReturn && remoteReturn.client == client && (remoteReturn.object.isCommunal || remoteReturn.object.owner as any == client)) {
			this.resolveRemoteReturn(payload.id, payload.data)
		}
	}

	public getLastRemoteReturns(): ServerRemoteReturnCollection {
		return this.remoteReturnCollections[this.remoteReturnCollectionCount - 1]
	}
}