import RemoteObject from "./remoteObject";
import RemoteMethod from "./remoteMethod";
import ExtensionTree from "../game/extensionTree";
import Network from "./network";
import GameObject from "../game/gameObject";

// holds the metadata for a paticular NetworkObject derived class
export default class NetworkMetadata {
	public classReference: { new(...args: any[]): {} }
	public className: string
	public constructorArgumentNames: string[] = []
	public illegalProperties: string[] = ["%[RemoteObject: owner]", "%[RemoteObject: isCommunal]", "%[GameObject: game]", "%[GameObject: gameObjectOptions]", "%[RemoteObject: remoteGroup]"]
	public remoteMethods: RemoteMethod[] = []
	
	constructor(classReference: { new(...args: any[]): {} }, ...args: string[]) {
		this.classReference = classReference
		this.className = classReference.name

		this.constructorArgumentNames = args
	}

	// inherits all networkMetadata things from parent classes
	public inheritEverything(): void {
		// inherit all the illegal properties from parent classes
		let leaf = ExtensionTree.getLeaf(this.classReference)
		if(leaf) {
			for(let parentClass of leaf.parents()) {
				let parentNetworkMetadata = Network.classToMetadata(parentClass.getClassReference())
				// go through parent metadata and inherit all illegal properties and remote methods
				if(parentNetworkMetadata) {
					this.illegalProperties = this.illegalProperties.concat(parentNetworkMetadata.illegalProperties)

					// copy the remote methods over
					for(let remoteMethod of parentNetworkMetadata.remoteMethods) {
						this.remoteMethods.push(new RemoteMethod(this, remoteMethod.call))
					}

					// recalculate remote method id's
					for(let remoteMethod of this.remoteMethods) {
						remoteMethod.recalculateIndex()
					}
				}
			}
		}
	}

	public addIllegalProperty(key: string): void {
		this.illegalProperties.push(key)
	}

	public addRemoteMethod(call: Function): RemoteMethod {
		let remoteMethod
		if((remoteMethod = this.getRemoteMethod(call)) == undefined) {
			remoteMethod = new RemoteMethod(this, call)
		}
		return remoteMethod
	}

	public getRemoteMethod(call: Function): RemoteMethod {
		for(let remoteMethod of this.remoteMethods) {
			if(remoteMethod.call == call) {
				return remoteMethod
			}
		}
		return undefined
	}

	// returns if property is illegal or not
	public isIllegalProperty(key: string): boolean {
		for(let property of this.illegalProperties) {
			if(property == key) {
				return true
			}
		}
		return false
	}
}