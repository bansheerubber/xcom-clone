import RemoteObject from "./remoteObject";
import Game from "../game/game";
import { gameClass, networkClass, illegal } from "./networkDecorators";
import ServerNetwork from "./serverNetwork";
import ClientInterpreter from "./clientInterpreter";
import Network, { RemoteObjectSend } from "./network";

// represents a connection that may send various network commands to objects in our server/client scene
@networkClass()
@gameClass
export default class Client extends RemoteObject {
	@illegal public websocket: any
	@illegal public ip: string
	@illegal public interpreter: ClientInterpreter = new ClientInterpreter(this)
	@illegal public ping: number = 0

	@illegal private lastPing: number = 0
	@illegal private lastActive: number = 0
	private static pingTime: number = 1000
	@illegal private canSend: boolean = false


	constructor(game: Game, websocket?: any, request?: any) {
		super(game)

		if(websocket && request) {
			this.websocket = websocket
			this.ip = request.connection.remoteAddress

			console.log(`${this.ip} has joined`)

			this.websocket.on("close", () => {
				console.log(`${this.ip} has left`)
				this.destroy()
			})

			this.websocket.on("message", (data: string) => {
				this.interpreter.interpret(data)
				this.lastActive = performance.now()
			})

			this.websocket.on("pong", () => {
				this.ping = Math.ceil((performance.now() - this.lastPing)) / 2
				this.lastActive = performance.now()
				this.send(4, this.ping)
			})

			// send all remote objects to the client
			setTimeout(() => {
				this.canSend = true
				this.send(0, (this.game.network as ServerNetwork).generateRemoteObjectsInit())
			}, 1)
		}
	}

	public tick(deltaTime: number): void {
		super.tick(deltaTime)

		// ping every x seconds
		let time = performance.now()
		if(time - this.lastPing > Client.pingTime) {
			this.websocket.ping()
			this.lastPing = time
		}
	}

	public reconstructor(game: Game) {
		super.reconstructor(game)
		
		this.game.network.clients.add(this)
		this.owner = this

		if(this.game.isServer) {
			setTimeout(() => {
				this.send(3, this.remoteID)
			}, 33)
		}
	}

	private send(commandID: number, payload: any): void {
		if(this.websocket.readyState == 1 && this.canSend) {
			let data = Network.stringifyObject([commandID, payload])
			this.websocket.send(data)
		}
	}

	public sendRemoteObject(remoteObject: RemoteObjectSend): void {
		this.send(0, [remoteObject])
	}

	public sendRemoteReturn(id: number, data: any): void {
		this.send(2, {
			id,
			data
		})
	}

	public sendRemoteMethod(groupID: number, objectID: number, methodID: number, returnID: number, args: any[]): void {
		this.send(1, {
			groupID,
			objectID,
			methodID,
			returnID,
			args,
		})
	}

	public destroy(): void {
		super.destroy()
		this.game.network.clients.delete(this)

		// disconnect the client form the server
		this.websocket.close()
	}

	public getLastActive(): number {
		return this.lastActive
	}
}