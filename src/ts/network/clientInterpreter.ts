import Client from "./client"
import ServerNetwork from "./serverNetwork";
import { RemoteMethodPayload, RemoteReturnPayload } from "./remoteMethod";
import Network from "./network";

// interprets commands sent by a client to the server. this class solely exists on the server
export default class ClientInterpreter {
	public client: Client
	


	constructor(client: Client) {
		this.client = client
	}

	public interpret(data: string): void {
		try { 
			var payload = Network.parseObject(data)

			switch(payload[0]) {
				case 0: {
					let remoteMethod = payload[1] as RemoteMethodPayload;
					(this.client.game.network as ServerNetwork).executeRemoteMethod(remoteMethod, this.client)
					break
				}

				case 1: {
					let remoteReturn = payload[1] as RemoteReturnPayload;
					(this.client.game.network as ServerNetwork).handleRemoteReturn(remoteReturn, this.client)
					break
				}
			}
		}
		catch(error) {
			console.log("Player: Failed to parse message", error)
			this.client.destroy()
		}
	}
}