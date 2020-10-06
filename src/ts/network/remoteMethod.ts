import NetworkMetadata from "./networkMetadata";
import RemoteObject from "./remoteObject";
import ClientNetwork from "./clientNetwork";
import ServerNetwork from "./serverNetwork";
import Network from "./network";
import Validator from "./validators/validator";
import Client from "./client"

interface ValidatedParameter {
	validateClass: any
	index: number
}

export interface RemoteMethodPayload {
	groupID: number
	objectID: number
	methodID: number
	returnID: number
	args: any[]
}

export interface RemoteReturnPayload {
	id: number
	data: any
}

export interface ClientRemoteReturn {
	object: RemoteObject
	promise: Promise<any>
}

export class ServerRemoteReturnCollection {
	public object: RemoteObject
	public promise: Promise<ServerResolve[]>
	public network: ServerNetwork
	public id: number
	public methodID: number

	private resolve: (value: ServerResolve[]) => void
	private resolvedReturns: ServerResolve[] = []
	private requiredResolveCount: number = 0



	constructor(network: ServerNetwork, id: number, methodID: number, requiredResolveCount: number) {
		this.network = network
		this.id = id
		this.methodID = methodID

		this.requiredResolveCount = requiredResolveCount

		this.promise = new Promise((resolve, reject) => {
			this.resolve = resolve
		})
	}

	// resolves one return
	public resolveRemoteReturn(resolve: ServerResolve): void {
		this.resolvedReturns.push(resolve)
		this.attemptResolve()
	}

	// rejects one return
	public rejectRemoteReturn(reject: ServerReject): void {
		this.requiredResolveCount-- // subtract from the resolve count so even if we fail one of the clients, we still are able to resolve later
		this.attemptResolve()
	}

	private attemptResolve(): void {
		// if we've resolved everything, then resolve our promise
		if(this.resolvedReturns.length == this.requiredResolveCount) {
			this.resolve(this.resolvedReturns)
			this.network.remoteReturnCollections[this.id] = undefined // reset the collection map
		}
	}
}

export interface ServerRemoteReturn {
	client: Client
	object: RemoteObject
	collection: ServerRemoteReturnCollection
	promise: Promise<ServerResolve>
}

export interface ServerResolve {
	client: Client
	value: any
}

export interface ServerReject {
	client: Client
	error: any
}

export default class RemoteMethod {
	public call: Function
	public name: string
	public networkMetadata: NetworkMetadata
	public validatedParameters: ValidatedParameter[] = []
	public validatedReturn: typeof Validator
	public playerParameters: boolean[] = [] // the index of all parameters we should substitute with the player who invoked it

	public isClientMethod: boolean = false
	public isServerMethod: boolean = false

	public isInstantCall: boolean = false

	public id: number = -1



	constructor(networkMetadata: NetworkMetadata, call: Function) {
		this.networkMetadata = networkMetadata
		this.networkMetadata.remoteMethods.push(this)
		this.id = this.networkMetadata.remoteMethods.indexOf(this)

		this.call = call
		this.name = this.call.name
	}

	public recalculateIndex(): void {
		this.id = this.networkMetadata.remoteMethods.indexOf(this)
	}

	public addValidatedParameter(index: number, typeClass: any): void {
		if(!this.validatedParameters[index]) {
			this.validatedParameters[index] = {
				validateClass: typeClass,
				index,
			}

			let validator = Network.validators.get(typeClass)
			if(!validator) {
				console.error(`Remote Method: Undefined validator for ${typeClass.name}`)
			}
		}
	}

	public addValidatedReturn(typeClass: any): void {
		this.validatedReturn = typeClass
	}

	public addPlayerParameter(index: number): void {
		this.playerParameters[index] = true
	}

	// makes the client request the server to call this remote method on the input object
	public requestToServer(remoteObject: RemoteObject, ...args: any[]): void {
		if(remoteObject.game.isClient && this.isServerMethod) {
			let methodID = -1
			for(let remoteMethod of remoteObject.getNetworkMetadata().remoteMethods) {
				if(this.call == remoteMethod.call) {
					methodID = remoteMethod.id
					break
				}
			}
			
			(remoteObject.game.network as ClientNetwork).requestServerMethod(remoteObject.remoteGroupID, remoteObject.remoteID, methodID, args)
			
			if(this.isInstantCall) {
				this.call.apply(remoteObject, args)
			}
		}
	}

	// makes the server request all clients to call this remote method on the input object
	public requestToClients(remoteObject: RemoteObject, onlyCallOnOwner: boolean, ...args: any[]): void {
		if(remoteObject.game.isServer && this.isClientMethod) {
			let methodID = -1
			for(let remoteMethod of remoteObject.getNetworkMetadata().remoteMethods) {
				if(this.call == remoteMethod.call) {
					methodID = remoteMethod.id
					break
				}
			}
			
			(remoteObject.game.network as ServerNetwork).requestClientMethod(remoteObject, remoteObject.remoteGroupID, remoteObject.remoteID, methodID, onlyCallOnOwner, args)

			if(this.isInstantCall) {
				this.call.apply(remoteObject, args)
			}
		}
	}

	// receives a request from a client to run a paticular remote method
	public receiveFromClient(remoteObject: RemoteObject, client: Client, ...args: any[]): any {
		// validate the arguments
		for(let i = 0; i < this.validatedParameters.length; i++) {
			let validation = this.validatedParameters[i]
			if(validation.validateClass) {
				let validator = Network.validators.get(validation.validateClass)
				if(!validator) {
					console.error(`Remote Method: Undefined validator for ${validation.validateClass.name}`)
					return {
						error: "undefined validator"
					}
				}
				else if(!validator.validate(args[i])) {
					console.error(`Remote Method: Failed to validate ${validation.validateClass.name} at arg index ${i} for method ${this.name}`)

					// disconnect the client for failing their argument check
					client.destroy()

					return {
						error: "failed validation"
					}
				}
			}
		}

		// add any player arguments as needed
		for(let i = 0; i < this.playerParameters.length; i++) {
			let isPlayerParameter = this.playerParameters[i]
			if(isPlayerParameter) {
				args[i] = client
			}
		}

		// make sure the client either owns the remote objecct or the remote object is communal
		if(remoteObject.isCommunal || remoteObject.owner as any == client) {
			return this.call.apply(remoteObject, args) // call the method
		}
	}

	// receives a request from the server to run a paticular remote method
	public receiveFromServer(remoteObject: RemoteObject, ...args: any[]): any {
		// validate the arguments
		return this.call.apply(remoteObject, args)
	}
}