import Game from "../game/game";
import NetworkMetadata from "./networkMetadata";
import RemoteObject from "./remoteObject";
import GameObject from "../game/gameObject";
import Validator from "./validators/validator";
import { isNull } from "util";
import NumberValidator from "./validators/numberValidator";
import StringValidator from "./validators/stringValidator";

export interface RemoteObjectReference {
	remoteID: number
	remoteGroupID: number
}

export interface RemoteObjectSend {
	remoteObjectString: string
	remoteObjectReferences: RemoteObjectReference[]
}

export interface StubObject {
	__stubGRID__: number
	__stubRID__: number
	__stubReferences__: StubReference[]
}

export interface StubReference {
	object: any
	key: any
}

interface SendObject {
	__ClassName__?: string
	__RID__?: number
	__GRID__?: number
}

export default class Network {
	public static game: Game

	public static debug: boolean = false
	
	public static networkMetadata: NetworkMetadata[] = []
	public static stubObjects: {
		[remoteGroupID: number]: {
			[remoteID: number]: StubObject
		}
	} = {}

	public static validators: Map<Function, typeof Validator> = new Map<Function, typeof Validator>()

	private static metadataNames: { [key: string]: boolean } = {
		"%[SendObject: __ClassName__]": true,
		"%[StubObject: __stubRID__]": true,
		"%[StubObject: __stubGRID__]": true,
		"%[StubObject: __stubReferences__]": true,
		"%[RemoteObject: owner]": true,
		"%[RemoteObject: isCommunal]": true,
		"%[RemoteObject: remoteGroup]": true,
	}


	
	public static setGame(game: Game): void {
		this.game = game
	}

	// blank function that just loads the modules up correctly
	public static loadValidator(validator: typeof Validator): void {

	}

	public static registerValidator(validator: typeof Validator, targetClass: Function) {
		this.validators.set(targetClass, validator)
	}

	// stringifies an object into a network safe string
	public static stringifyObject(object: {}, ignoreFirstRemoteification: boolean = false): string {
		try {
			return JSON.stringify(this.convertObject(object, ignoreFirstRemoteification))
		}
		catch(error) {
			console.error(`Network: Failed to stingify object ${object.constructor.name}`, error)
			return undefined
		}
	}

	// parse a network safe string and converts it into a real object
	public static parseObject(input: string): any {
		if(this.debug) {
			console.log(input)
		}
		
		try {
			return this.deConvertObject(JSON.parse(input))
		}
		catch(error) {
			console.error("Network: Failed to parse object.", error)
			return undefined
		}
	}

	// recursively converts an object to something that can acceptably be sent over the network. if ignoreFirstRemoteification is true, then we send all properties on a remote object (only for the first iteration). if false, we only send the classname and RID
	private static convertObject(object: {}, ignoreFirstRemoteification: boolean = false): any {
		// handle objects differently than primitives
		if(typeof object == "object" && !isNull(object) && typeof object != "undefined") {
			if(Array.isArray(object)) {
				var replacementObject: SendObject = [] as any
			}
			else {
				var replacementObject: SendObject = {}
			}
			
			if(object instanceof RemoteObject) {
				var networkMetadata = object.getNetworkMetadata() // get the network data if this is a remote object, handle for later

				// if we choose to turn this remoteObject into an RID reference object, then do it
				if(!ignoreFirstRemoteification) {
					replacementObject.__RID__= (object as RemoteObject).remoteID
					replacementObject.__GRID__ = (object as RemoteObject).remoteGroupID
					return replacementObject
				}
			}

			if((object as any).c) {
				replacementObject.__ClassName__ = (object as any).c // add its classname to the final object
			}
			else if(object.constructor.name != "Object") {
				replacementObject.__ClassName__ = object.constructor.name
			}

			// loop through all the object's properties
			for(let i of Object.getOwnPropertyNames(object)) {
				if(networkMetadata) {
					if(!networkMetadata.isIllegalProperty(i)) { // only copy over legal properties
						replacementObject[i] = this.convertObject(object[i])
					}
				}
				else { // if this object is not a remote object, do not check to see if it has illegal properties
					replacementObject[i] = this.convertObject(object[i])
				}
			}
			return replacementObject // return the object, which is now ready to be sent over the network
		}
		// if we have a primitive, then we don't even modify it
		else {
			return object
		}
	}

	// recursively deconvert an object received over thet network
	private static deConvertObject(object: any, debugPropertyName?: string, debugClassName?: string): any {
		let object2: SendObject = object
		
		// recursively handle objects
		if(typeof object2 == "object") {
			// if we have an RID, then lookup the object with that RID and return it
			if(object2.__RID__ !== undefined && this.game.network.remoteObjects[object2.__GRID__]) {
				let remoteObject = this.game.network.remoteObjects[object2.__GRID__][object2.__RID__]
				if(remoteObject) { // if the remote object DOES exist, then return that remote object
					return remoteObject
				}
				// if the remote object doesn't exist, then add a stub object that we can change later
				else {
					let stub = this.setStubObject(object2.__GRID__, object2.__RID__)
					this.game.network.addRemoteObject(stub as any, object2.__GRID__, object2.__RID__) // add them to the remote objects list
					return stub
				}
			}

			// if they have a remote ID, then add them to the remote objects list
			/*if((object2 as RemoteObject).remoteID !== undefined) {
				this.game.network.addRemoteObject(object2 as RemoteObject, (object2 as RemoteObject).remoteGroupID, (object2 as RemoteObject).remoteID)
			}
			// if this is a remote object, then slot it into its remote object slot. we're going to build ontop of the data in this slot later.
			else if(object2.__GRID__ !== undefined && object2.__RID__ !== undefined) {
				this.game.network.addRemoteObject(object2 as RemoteObject, object2.__GRID__, object2.__RID__)
			}*/

			// check to see if this object has a stub object. if so, then that becomes our newObject
			// stub objects replace objects that hold the RID of an object. the same stub object is used between different properties that refer to the same remoteObject, so when the stub object is deconverted later the changes made to it in here are reflected upon all property values
			let newObject: any = {}
			if(this.stubObjects[(object2 as RemoteObject).remoteGroupID]
				&& this.stubObjects[(object2 as RemoteObject).remoteGroupID][(object2 as RemoteObject).remoteID]) {
				
				newObject = this.stubObjects[(object2 as RemoteObject).remoteGroupID][(object2 as RemoteObject).remoteID]
				var isStubObject = true
			}
			// if we have a remote object in its remote object slot (which will always be true), then use this remote object and build upon it
			else if(this.game.network.remoteObjects[object2.__GRID__]
				&& this.game.network.remoteObjects[object2.__GRID__][object2.__RID__]) {

				newObject = this.game.network.remoteObjects[object2.__GRID__][object2.__RID__]
			}
			// if we have a remote object in its remote object slot (which will always be true), then use this remote object and build upon it
			else if(this.game.network.remoteObjects[(object2 as RemoteObject).remoteGroupID]
				&& this.game.network.remoteObjects[(object2 as RemoteObject).remoteGroupID][(object2 as RemoteObject).remoteID]) {

				newObject = this.game.network.remoteObjects[(object2 as RemoteObject).remoteGroupID][(object2 as RemoteObject).remoteID]

				// if the classname is undefined, that usually means the network conversion process has already been completed. if this is detected, then just return this remote object, because we don't want to convert it again due to glitchiness/wasting time
				if((newObject as SendObject).__ClassName__ === undefined) {
					return newObject
				}
			}

			let networkMetadata = this.nameToMetadata(object2.__ClassName__) // get the network metadata so we can get the class reference based on the classname of the object
			if(object2.__ClassName__) { // if we have a classname, recreate that object (without calling the constructor)
				if(object2.__ClassName__ == "Array") { // special case for array, manually create an array object for this
					newObject = []
				}
				else if(networkMetadata) {
					if(isStubObject) { // we have to do this creation process differntly if we have found a stub object. fuck
						Object.setPrototypeOf(newObject, networkMetadata.classReference.prototype)
						// once we have created a stub object, delete the stub object metadata slot
						delete (newObject as StubObject).__stubRID__
						delete (newObject as StubObject).__stubGRID__
						delete (newObject as StubObject).__stubReferences__
					}
					else { // modify the new object to have the same prototype as the class we received without calling its constructor. this will add a prototype to the newObject in the .remoteObjects list
						Object.setPrototypeOf(newObject, networkMetadata.classReference.prototype)
					}
					var classReference = networkMetadata.classReference
				}
				else {
					console.error(`deConvertObject: Invalid Class name ${object2.__ClassName__}, found on ${debugClassName}.${debugPropertyName}`)
				}
			}
			else if(Array.isArray(object2)) { // if we're an array, do something funky
				newObject = []
			}
			
			// go through the received object properties and deconvert those
			for(let i of Object.getOwnPropertyNames(object2)) {
				if(classReference) { // if we have a class reference, pull out the descriptor for the property we're looking at and determine if we can write to it or not
					var descriptor = Object.getOwnPropertyDescriptor(classReference, i)
				}

				// make sure the property isn't eggine metadata and make sure we can write to this property
				if(!this.metadataNames[i] && ((descriptor && descriptor.writable) || !descriptor)) {
					newObject[i] = this.deConvertObject(object2[i], i, object2.__ClassName__) // this will modify the object in the .remoteObjects list

					if((newObject[i] as StubObject).__stubRID__ !== undefined) { // if we have a stub, then add our reference to it
						(newObject[i] as StubObject).__stubReferences__.push({
							object: newObject,
							key: i,
						})
					}
				}
			}
			delete (newObject as SendObject).__ClassName__ // remove the class name from this object once we're all done
			return newObject
		}
		else {
			return object2
		}
	}

	// registers a remote object class with our metadata system
	public static registerRemoteClass(networkClass: { new(...args: any[]): {} }, ...constructorArgumentNames: string[]): NetworkMetadata {
		let networkMetadata: NetworkMetadata
		if(!(networkMetadata = this.classToMetadata(networkClass))) { // if we do not have a class reference made already, then create one
			networkMetadata = new NetworkMetadata(networkClass, ...constructorArgumentNames)
			this.networkMetadata.push(networkMetadata)
		}
		else { // if it is already created, then update the constructor arguments
			networkMetadata.constructorArgumentNames = constructorArgumentNames
		}

		return networkMetadata
	}

	// builds the instance variables of a remote object based on network received properties. these variables are then used to construct/reconstruct the object
	public static buildInstanceVariables(networkMetadata: NetworkMetadata, objectProperties: {}): any[] {
		let output = []
		for(let argument of networkMetadata.constructorArgumentNames) {
			if(argument == "%[GameObject: game]") {
				output.push(this.game)
			}
			else {
				output.push(objectProperties[argument])
			}
		}
		return output
	}

	// returns a NetworkMetadata object that is assigned to the coresponding class name
	public static nameToMetadata(className: string): NetworkMetadata {
		for(let networkMetadata of this.networkMetadata) {
			if(networkMetadata.className == className) {
				return networkMetadata
			}
		}
		return undefined
	}

	// looks up a class reference and returns its metadata
	public static classToMetadata(classReference: { new(...args: any[]): {} }): NetworkMetadata {
		return this.nameToMetadata(classReference.name)
	}

	// creates a stub object whose properties we will modify as soon as we receive information about it
	public static setStubObject(remoteGroupID: number, remoteID: number): StubObject {
		if(!this.stubObjects[remoteGroupID]) {
			this.stubObjects[remoteGroupID] = []
		}
		
		if(!this.stubObjects[remoteGroupID][remoteID]) {
			this.stubObjects[remoteGroupID][remoteID] = {
				__stubGRID__: remoteGroupID,
				__stubRID__: remoteID,
				__stubReferences__: [],
			}
		}
		return this.stubObjects[remoteGroupID][remoteID]
	}

	// creates a remote class reference, which is used to make networking less complex
	public static createRemoteClass<T>(ownerObject: RemoteObject, position: number, remoteClass: { new(...args: any[]): {} }, ...args: any[]): T {
		// if we find a class reference at the position, then return that reference
		if(ownerObject.remoteGroupID != -1 && ownerObject.remoteID != -1
			&& this.game.network.remoteClassReferences[ownerObject.remoteGroupID] 
			&& this.game.network.remoteClassReferences[ownerObject.remoteGroupID][ownerObject.remoteID]
			&& this.game.network.remoteClassReferences[ownerObject.remoteGroupID][ownerObject.remoteID][position]
		) {	
			let object = this.game.network.remoteClassReferences[ownerObject.remoteGroupID][ownerObject.remoteID][position]
			object.reconstructor(this.game, ...this.buildInstanceVariables(this.classToMetadata(remoteClass), object)) // call the reconstructor with correct instance variables
			return object as any
		}
		else if(remoteClass.prototype instanceof RemoteObject) { // if we do not find a class reference at the position, then create a new reference
			let remoteObject = new remoteClass(...args) as T
			this.game.network.addRemoteClassReference(ownerObject, remoteObject as any, position)
			return remoteObject
		}
		else {
			return new remoteClass(...args) as T
		}
	}
}

// register GameObject n shit, b/c we can't do it with decorators because of import conflicts
Network.registerRemoteClass(GameObject as any, "%[GameObject: game]")
Network.classToMetadata(GameObject as any).addIllegalProperty("%[GameObject: game]")
Network.classToMetadata(GameObject as any).addIllegalProperty("%[GameObject: gameObjectOptions]")

Network.loadValidator(NumberValidator)
Network.loadValidator(StringValidator)