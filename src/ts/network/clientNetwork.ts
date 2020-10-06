import NetworkBase from "./networkBase";
import Network, { RemoteObjectSend as RemoteObjectPayload, RemoteObjectReference } from "./network";
import Game from "../game/game";
import RemoteObject from "./remoteObject";
import { RemoteMethodPayload, RemoteReturnPayload, ClientRemoteReturn } from "./remoteMethod";
import Client from "./client";
import Scheduler from "../game/scheduler";

enum ClientNetworkConnetionStatus {
	CONNECTING,
	CONNECTED,
	CLOSED,
	RECONNECTING,
}

// handles the websocket connection for a ClientNetwork instance
class ClientNetworkConnection {
	public network: ClientNetwork
	private websocket: WebSocket
	public bytesReceived: number
	public ping: number = -1
	public url: string = "n/a"
	public serverName: string = "n/a"
	private nameToOption: Map<string, string> = new Map()
	public status: ClientNetworkConnetionStatus = ClientNetworkConnetionStatus.CLOSED



	constructor(network: ClientNetwork) {
		this.network = network

		// this.connect("wss://bansheerubber.com:" + ServerNetworkHost.port)
	}

	// adds a connection option to our list
	public addOption(url: string, name: string): void {
		this.nameToOption.set(name, url)
	}

	// connections to one of our connection options by name
	public connectByName(name: string): void {
		this.connect(this.nameToOption.get(name), name)
	}

	public getStatusString(): string {
		for(let property in ClientNetworkConnetionStatus) {
			if((ClientNetworkConnetionStatus[property] as any as ClientNetworkConnetionStatus) == this.status) {
				return property
			}
		}
		return "n/a"
	}

	// connect to the server
	public connect(url: string, name: string = "n/a"): void {
		this.url = url
		this.serverName = name

		this.status = ClientNetworkConnetionStatus.CONNECTING

		// create the websocket
		this.websocket = new WebSocket(url)
		this.websocket.onmessage = this.onMessage.bind(this)
		this.websocket.onopen = this.onConnected.bind(this)
		this.websocket.onclose = this.onClosed.bind(this)
		this.websocket.onerror = this.onError.bind(this)

		this.bytesReceived = 0
	}

	// disconnect from the server
	public disconnect(): void {
		this.websocket.close()
	}

	// called when we connect up to the server
	private onConnected(event): void {
		this.ping = 0
		this.status = ClientNetworkConnetionStatus.CONNECTED

		console.log(`Connected to '${this.url}'`)
	}

	private onClosed(event): void {
		this.ping = -1
		this.url = ""
		this.serverName = ""

		if(this.status == ClientNetworkConnetionStatus.CONNECTED) {
			this.status = ClientNetworkConnetionStatus.CLOSED
		}
	}

	private onError(error): void {
		console.error("Connection Error:", error)
		// try to reconnect later
		let url = this.url
		let name = this.serverName
		Scheduler.schedule(10, () => {
			this.connect(url, name)
		})

		this.status = ClientNetworkConnetionStatus.RECONNECTING
	}

	private onMessage(event: MessageEvent): void {
		try {
			var message = Network.parseObject(event.data)
			this.bytesReceived += event.data.length
		}
		catch(error) {
			console.error("Client Network: Failed to parse server message.", error)
		}

		// parse the command
		switch(message[0]) {
			// initialize remote object references
			// [commandID, RemoteObjectPayload[]]
			case 0: {
				let remoteObjects = message[1] as RemoteObjectPayload[]
				this.network.parseRemoteObjectsInit(remoteObjects)
				break
			}

			// handle remote methods
			// [commandID, RemoteMethodPayload]
			case 1: {
				let remoteMethod = message[1] as RemoteMethodPayload
				this.network.executeRemoteMethod(remoteMethod)
				break
			}

			// handle remote returns
			// [commandID, RemoteReturnPayload]
			case 2: {
				let remoteReturn = message[1] as RemoteReturnPayload
				this.network.resolveRemoteReturn(remoteReturn.id, remoteReturn.data)
				break
			}

			// tell the game that we own this paticular client
			case 3: {
				let remoteID = message[1] as number
				this.network.game.client = this.network.remoteObjects[0][remoteID] as Client
				break
			}

			// handle receiving latency
			// [commandID, latency: number]
			case 4: {
				this.ping = message[1] as number
				break
			}
		}
	}

	public send(commandID: number, payload: any): void {
		this.websocket.send(Network.stringifyObject([commandID, payload]))
	}
}

// handles the client-sided connection with the server over websockets
export default class ClientNetwork extends NetworkBase {
	public client: ClientNetworkConnection
	public remoteReturns: { [key: number]: ClientRemoteReturn } = {}

	private pause_: boolean = false
	private pauseResolve: () => void
	private pausePromise: Promise<void>
	


	constructor(game: Game) {
		super(game)

		this.client = new ClientNetworkConnection(this)
	}

	public set pause(value: boolean) {
		if(this.pauseResolve && value == false) {
			this.pauseResolve()
			this.pausePromise = undefined
			this.pauseResolve = undefined
		}
		else if(value == true) {
			this.pausePromise = new Promise<void>((resolve, reject) => {
				this.pauseResolve = resolve
			})
		}

		this.pause_ = value
	}

	public get pause(): boolean { 
		return this.pause_
	}
	
	// when the server sends a payload that wants us to create a bunch of objects, we will parse it here and do all the object creation here
	public async parseRemoteObjectsInit(payload: RemoteObjectPayload[]): Promise<void> {
		let newObjects = []
		for(let remoteObjectSend of payload) {
			newObjects.push(Network.parseObject(remoteObjectSend.remoteObjectString)) // parse the object properties string. this will create the object and assign them correct positions in our remoteID lists
		}

		// generate the class reference object lists before we reconstruct, so every new object has their references ready before anything is reconstructed
		for(let i in newObjects) {
			let object = newObjects[i] // our new object
			let classReferences = payload[i].remoteObjectReferences // the class references associated with this object
			let objectReferences = [] // the object references we will need to generate

			// go through the remoteIDs we were received and replace them with their corresponding class references
			for(let i = 0; i < classReferences.length; i++) {
				let classReference = classReferences[i] as RemoteObjectReference
				if(classReference.remoteGroupID !== undefined && classReference.remoteID !== undefined) {
					objectReferences[i] = this.game.network.remoteObjects[classReference.remoteGroupID][classReference.remoteID]
				}
			}

			this.game.network.setRemoteClassReferences(object, objectReferences) // set the class references so when we call the reconstructor the class reference creator will handle everything smoothly
		}

		// now we need to handle reconstruction. go through the objects we were sent in the order they were created in on the server and reconstruct each one
		for(let object of newObjects) {
			let remoteObject = object as RemoteObject
			if(!this.game.network.hasBeenReconstructed[remoteObject.remoteGroupID][remoteObject.remoteID]) { // only reconstruct the object if it hasn't been reconstructed before
				remoteObject.reconstructor(Network.game, ...Network.buildInstanceVariables(remoteObject.getNetworkMetadata(), remoteObject)) // call reconstructor with correct instance variables

				this.game.network.addRemoteObject(remoteObject, remoteObject.remoteGroupID, remoteObject.remoteID)

				if(this.pausePromise) { // if we pause, then wait for the pause to finish
					await this.pausePromise
				}
			}
		}
	}

	// asks the server to call a method on a paticular remote object
	public requestServerMethod(groupID: number, objectID: number, methodID: number, args: any[]) {
		// create a promise object so we can do remote returns
		let returnID = this.remoteReturnCount
		this.remoteReturns[returnID] = {
			object: this.remoteObjects[groupID][objectID],
			promise: new Promise<any>((resolve, reject) => {
				this.remoteResolves[returnID] = resolve
				this.remoteRejects[returnID] = reject

				// have a timeout so that we cancel a remote return after a certain amount of time
				setTimeout(() => {
					this.rejectRemoteReturn(returnID, "timeout")
				}, 5000)
			}),
		}
		
		// send the command to the server
		this.client.send(0, {
			groupID,
			objectID,
			methodID,
			returnID,
			args,
		} as RemoteMethodPayload)

		this.remoteReturnCount++
	}

	private sendRemoteReturn(id: number, data: any): void {
		this.client.send(1, {
			id,
			data,
		} as RemoteReturnPayload)
	}

	// execute a remote method sent by the server
	public executeRemoteMethod(payload: RemoteMethodPayload): void {
		let { groupID, objectID, methodID, returnID, args } = payload

		if(this.remoteObjects[groupID] && this.remoteObjects[groupID][objectID]) {
			let object = this.remoteObjects[groupID][objectID]

			// make sure we're the client and we have an actual remote method to call in the first place
			if(this.game.isClient && object.getNetworkMetadata().remoteMethods[methodID]) {
				let data = object.getNetworkMetadata().remoteMethods[methodID].receiveFromServer(object, ...args)
				this.sendRemoteReturn(returnID, data)
			}
		}
	}

	public getLastRemoteReturn(): ClientRemoteReturn {
		return this.remoteReturns[this.remoteReturnCount - 1]
	}
}