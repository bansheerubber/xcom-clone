import RemoteObject from "./remoteObject";
import Game from "../game/game";
import Client from "./client"
import RemoteGroup from "./remoteGroup";
import { StubObject } from "./network";

// base class for the server/client network classes, has some abstract functions
export default abstract class NetworkBase {
	public remoteObjects: {
		[remoteGroupID: number]: { 
			[remoteID: number]: RemoteObject
		}
	} = {}
	
	public remoteGroups: {
		[remoteGroupID: number]: RemoteGroup
	} = {}

	public remoteObjectsSet: Set<RemoteObject> = new Set<RemoteObject>()

	public remoteClassReferences: {
		[remoteGroupID: number]: { 
			[remoteID: number]: RemoteObject[]
		}
	} = {}

	public game: Game

	public hasBeenReconstructed: {
		[remoteGroupID: number]: {
			[remoteID: number]: boolean
		}
	} = {}

	public clients: Set<Client> = new Set<Client>()

	public remoteReturns: {
		[key: number]: any
	} = {}

	protected remoteReturnCount: number = 0

	protected remoteResolves: {
		[key: number]: (value: any) => void
	} = {}

	protected remoteRejects: {
		[key: number]: (reason: any) => void
	} = {}



	constructor(game: Game) {
		this.game = game
	}

	public addRemoteObject(remoteObject: RemoteObject, customRemoteGroup?: number, customRemoteID?: number): void {	
		let stubReferences = undefined
		if(customRemoteGroup !== undefined && customRemoteID !== undefined 
			&& this.remoteObjects[customRemoteGroup] !== undefined
			&& this.remoteObjects[customRemoteGroup][customRemoteID] !== undefined) {

			if((this.remoteObjects[customRemoteGroup][customRemoteID] as any as StubObject).__stubReferences__?.length > 0) {
				stubReferences = (this.remoteObjects[customRemoteGroup][customRemoteID] as any as StubObject).__stubReferences__
			}
			
			this.removeRemoteObject(this.remoteObjects[customRemoteGroup][customRemoteID])
		}
		
		let groupID = customRemoteGroup != undefined ? customRemoteGroup : 0
		let remoteID = customRemoteID != undefined ? customRemoteID : this.remoteGroups[groupID].getNextRemoteID() // get the next remote id from the group
		this.remoteObjects[groupID][remoteID] = remoteObject // add to our map
		this.remoteGroups[groupID].add(remoteObject) // add to the group
		remoteObject.remoteID = remoteID
		remoteObject.remoteGroupID = groupID

		this.remoteObjectsSet.add(remoteObject)

		// make sure stub references are set correctly, or die
		if(stubReferences) {
			for(let stubReference of stubReferences) {
				stubReference.object[stubReference.key] = remoteObject
			}
		}
	}

	public removeRemoteObject(remoteObject: RemoteObject): void {
		// delete this.remoteObjects[remoteObject.remoteGroupID][remoteObject.remoteID]
		remoteObject.remoteGroup?.remove(remoteObject)
		this.remoteObjectsSet.delete(remoteObject)
	}

	public setRemoteClassReferences(ownerObject: RemoteObject, array: RemoteObject[]): void {
		if(this.remoteClassReferences[ownerObject.remoteGroupID] === undefined) {
			this.remoteClassReferences[ownerObject.remoteGroupID] = []
		}
		this.remoteClassReferences[ownerObject.remoteGroupID][ownerObject.remoteID] = array
	}

	public addRemoteClassReference(ownerObject: RemoteObject, otherObject: RemoteObject, position: number): void {
		if(this.remoteClassReferences[ownerObject.remoteGroupID] === undefined) {
			this.remoteClassReferences[ownerObject.remoteGroupID] = []
		}
		
		if(this.getRemoteClassReferences(ownerObject) === undefined) {
			this.remoteClassReferences[ownerObject.remoteGroupID][ownerObject.remoteID] = []
		}

		this.remoteClassReferences[ownerObject.remoteGroupID][ownerObject.remoteID][position] = otherObject
	}

	public abstract executeRemoteMethod(...args: any[]): void

	public getRemoteClassReferences(ownerObject: RemoteObject): RemoteObject[] {
		if(this.remoteClassReferences[ownerObject.remoteGroupID] === undefined) {
			return undefined
		}
		else {
			return this.remoteClassReferences[ownerObject.remoteGroupID][ownerObject.remoteID]
		}
	}

	public resolveRemoteReturn(returnID: number, data: any): any {
		if(this.remoteResolves[returnID]) {
			this.remoteResolves[returnID](data)

			// cleanup the various data structures we shat the promise into
			this.remoteResolves[returnID] = undefined
			this.remoteRejects[returnID] = undefined
			this.remoteReturns[returnID] = undefined
		}
	}

	public rejectRemoteReturn(returnID: number, reason?: any): void {
		if(this.remoteRejects[returnID]) {
			this.remoteRejects[returnID](reason)

			// cleanup the various data structures we shat the promise into
			this.remoteResolves[returnID] = undefined
			this.remoteRejects[returnID] = undefined
			this.remoteReturns[returnID] = undefined
		}
	}
}