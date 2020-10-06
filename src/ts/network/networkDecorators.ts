import "reflect-metadata"
import RemoteMethod from "./remoteMethod";
import ExtensionTree from "../game/extensionTree";
import GameObject from "../game/gameObject";
import RemoteObject from "./remoteObject";
import Validator from "./validators/validator";
import Network from "./network";

// registers a class as a game class, allows us to look up their inheritance tree
export function gameClass<T extends {new(...args:any[]): GameObject}>(classReference: T) {
	let parentClass = Object.getPrototypeOf(classReference)
	if(parentClass.name) {
		ExtensionTree.addExtendedClass(parentClass, classReference)
	}

	let returnClass = class extends (<any>classReference) {
		private c: string = classReference.name
		
		constructor(...args: any[]) { 
			super(...args)

			if((this as unknown as RemoteObject).reconstructor && this.c == this.constructor.name) {
				(this as unknown as RemoteObject).reconstructor.apply(this, args)
			}
		}
	} as any

	Object.defineProperty(returnClass, "name", {
		writable: true,
	})
	returnClass.name = classReference.name
	Object.defineProperty(returnClass, "name", {
		writable: false,
	})

	return returnClass
}

// marks this class as a network class
export function networkClass(...args: string[]) {
	return (classReference: Function) => {
		Network.registerRemoteClass(classReference as any, ...args).inheritEverything()
	}
}

// marks this class as a validator class
export function validator(targetClass: Function) {
	return (classReference: typeof Validator) => {
		setTimeout(() => {
			Network.registerValidator(classReference, targetClass)
		}, 1)
	}
}

// marks a class property as illegal for network recreation/sending
export function illegal(classReference: any, key: string): void {
	Network.registerRemoteClass(classReference.constructor as any).addIllegalProperty(key)
}

function addValidators(classReference: any, methodName: string): RemoteMethod {
	let remoteMethod = Network.registerRemoteClass(classReference.constructor as any).addRemoteMethod(classReference[methodName])
	let types = Reflect.getMetadata("design:paramtypes", classReference, methodName)
	for(let i = 0; i < types.length; i++) {
		remoteMethod.addValidatedParameter(i, types[i])
	}

	remoteMethod.addValidatedReturn(Reflect.getMetadata("design:returntype", classReference, methodName))

	return remoteMethod
}

// tells the remote method that the recipient is the client. if callOnServer is true, that means we will request the client to call this method and also call it on our server
export function client(callOnServer: boolean = false, onlyCallOnOwner: boolean = false) {
	return function (classReference: any, methodName: string, descriptor: PropertyDescriptor): void {
		// add validators to the remote method
		let remoteMethod = addValidators(classReference, methodName)
		remoteMethod.isClientMethod = true
		remoteMethod.isInstantCall = callOnServer
		
		descriptor.value = function(...args: any[]) {
			remoteMethod.requestToClients(this, onlyCallOnOwner, ...args)
		}
    }
}

// tells the remote method that the recipient is the server. if callOnClient is true, that means we will request the server to call this method and also call it on our client
export function server(callOnClient: boolean = false) {
	return function (classReference: any, methodName: string, descriptor: PropertyDescriptor): void {
		// add validators to the remote method
		let remoteMethod = addValidators(classReference, methodName)
		remoteMethod.isServerMethod = true
		remoteMethod.isInstantCall = callOnClient
		
		descriptor.value = function(...args: any[]) {
			remoteMethod.requestToServer(this, ...args)
			return "frog"
		}
    }
}

// tells the remote method to not validate this paramater
export function novalidate(classReference: { new(...args: any[]): {} }, methodName: string | symbol, parameterIndex: number): void {
	// holy shit this is long. first, make sure the networkMetadata object is created. next, make sure the remote method is created. last, remove the validated paramater
	Network.registerRemoteClass(classReference.constructor as any).addRemoteMethod(classReference[methodName]).addValidatedParameter(parameterIndex, undefined)
}

// tells the remote method that the argument at this index should be supplied with the value of the client who invoked it. also, does not validate this parameter
export function player(classReference: { new(...args: any[]): {} }, methodName: string | symbol, parameterIndex: number): void {
	Network.registerRemoteClass(classReference.constructor as any).addRemoteMethod(classReference[methodName]).addPlayerParameter(parameterIndex)
	Network.registerRemoteClass(classReference.constructor as any).addRemoteMethod(classReference[methodName]).addValidatedParameter(parameterIndex, undefined)
}