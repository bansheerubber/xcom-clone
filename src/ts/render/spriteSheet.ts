import * as PIXI from "pixi.js"
import Sprite from "./sprite";
import Game from "../game/game";

export default class SpriteSheet extends Sprite {
	public static textureProperties: {
		[index: string]: string[]
	} = {}
	
	
	public spritesheet: PIXI.Spritesheet
	protected _sheetIndex: number = 0
	protected _sheetName: string = ""
	private _source: string


	
	constructor(game: Game, resource?: string | PIXI.Spritesheet, customContainer?: PIXI.Container) {
		super(game, undefined, customContainer)

		try {
			if(resource instanceof PIXI.Spritesheet) {
				this.spritesheet = resource
			}
			else {
				this.spritesheet = PIXI.Loader.shared.resources[resource].spritesheet			
			}
			this._source = (this.spritesheet.baseTexture.resource as any).url

			this.sheetIndex = 0
		}
		catch(error) {
			console.log(`Failed to load spritesheet resource ${resource}.`, error)
		}
	}

	set sheetName(sheetName: string) {
		if(this.spritesheet.textures) {
			if(!SpriteSheet.textureProperties[this._source]) {
				SpriteSheet.textureProperties[this._source] = Object.getOwnPropertyNames(this.spritesheet.textures)
			}
			let properties = SpriteSheet.textureProperties[this._source]

			this.sheetIndex = properties.indexOf(sheetName)
		}
	}

	get sheetName(): string {
		return this._sheetName
	}

	set sheetIndex(sheetIndex: number) {
		this._sheetIndex = sheetIndex

		if(this.spritesheet.textures) {
			if(!SpriteSheet.textureProperties[this._source]) {
				SpriteSheet.textureProperties[this._source] = Object.getOwnPropertyNames(this.spritesheet.textures)
			}
			let properties = SpriteSheet.textureProperties[this._source]

			sheetIndex = sheetIndex % properties.length
			this.texture = this.spritesheet.textures[properties[sheetIndex]]

			this._sheetName = properties[sheetIndex]
		}
	}

	get sheetIndex(): number {
		return this._sheetIndex
	}

	get source(): string {
		return this._source
	}
}