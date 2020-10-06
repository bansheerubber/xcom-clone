import * as PIXI from "pixi.js"
import RenderObject from "./renderObject"
import Game from "../game/game";

export default class Text extends RenderObject {
	private text: PIXI.Text
	public isFloating: boolean = true


	
	constructor(game: Game, message: string, isFloating: boolean, style?: PIXI.TextStyle) {
		super(game)

		this.text = new PIXI.Text(message, style)
		this.message = message
		this.style = style

		this.isFloating = isFloating

		if(isFloating) {
			this.game.renderer.static.addChild(this.text)
		}
		else {
			this.game.renderer.dynamic.addChild(this.text)
		}

		this.game.renderer.addObject(this)
	}

	set message(message: string) {
		this.text.text = message
	}

	get message(): string {
		return this.text.text
	}

	set style(style: PIXI.TextStyle) {
		this.text.style = style
	}

	get style(): PIXI.TextStyle {
		return this.text.style
	}
}