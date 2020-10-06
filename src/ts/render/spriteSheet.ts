import * as PIXI from "pixi.js"
import Sprite from "./sprite";
import Game from "../game/game";

export default class SpriteSheet extends Sprite {
	public spritesheet: PIXI.Spritesheet
	protected _sheetIndex: number = 0


	
	constructor(game: Game, resource?: string | PIXI.Spritesheet, customContainer?: PIXI.Container) {
		super(game, undefined, customContainer)

		try {
			if(resource instanceof PIXI.Spritesheet) {
				this.spritesheet = resource
			}
			else {
				this.spritesheet = PIXI.Loader.shared.resources[resource].spritesheet
			}
			this.sheetIndex = 0
		}
		catch(error) {
			console.log(`Failed to load spritesheet resource ${resource}.`, error)
		}
	}

	set sheetIndex(sheetIndex: number) {
		this._sheetIndex = sheetIndex

		if(this.spritesheet.textures) {
			let properties = Object.getOwnPropertyNames(this.spritesheet.textures)
			sheetIndex = sheetIndex % properties.length
			this.texture = this.spritesheet.textures[properties[sheetIndex]]
		}
	}

	get sheetIndex(): number {
		return this._sheetIndex
	}
}