import Game from "./game";
import Physical from "../render/physical";
import Camera from "../render/camera";

// camera that follows a physical object around. it is up to the physical object to implement camera tracking
export default class TrackingCamera extends Camera {
	private _owner: Physical
	


	constructor(game: Game, owner: Physical) {
		super(game)

		this.owner = owner
	}

	get owner(): Physical {
		return this._owner
	}

	set owner(value: Physical) {
		if(this._owner) {
			this._owner.cameras.splice(this._owner.cameras.indexOf(this), -1)
		}
		
		this._owner = value
		this._owner.cameras.push(this)
		this.position.set(this._owner.getPosition().x, this._owner.getPosition().y)
	}

	public onActivated(): void {
		if(this.owner) {
			this.position.set(this.owner.getPosition().x, this.owner.getPosition().y)
		}
	}

	public onDeActivated(): void {

	}
}