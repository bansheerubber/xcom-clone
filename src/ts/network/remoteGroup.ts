import Game from "../game/game";
import RemoteObject from "./remoteObject";

// organizes remote ids into their own groups. each remote id is unique to its own group only
export default class RemoteGroup {
	public game: Game
	public index: number = -1
	private remoteObjects: Set<RemoteObject> = new Set()
	private nextRemoteID: number = 0
	public readonly autoSend: boolean = true
	
	
	
	constructor(game: Game, index: number, autoSend: boolean = true) {
		this.autoSend = autoSend
		
		this.game = game
		this.index = index

		this.game.network.remoteObjects[this.index] = {} // create our map on the network object
		this.game.network.hasBeenReconstructed[this.index] = {}
		this.game.network.remoteGroups[this.index] = this
	}

	public add(object: RemoteObject): void {
		this.remoteObjects.add(object)
		object.remoteGroupID = this.index
		object.remoteGroup = this
		this.nextRemoteID++
	}

	public remove(object: RemoteObject): void {
		this.remoteObjects.delete(object)
	}
	
	public getNextRemoteID(): number {
		return this.nextRemoteID
	}
}