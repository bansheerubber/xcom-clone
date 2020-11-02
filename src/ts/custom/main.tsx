import Game from "../game/game";
import ImageResource from "../render/imageResource";
import XCOMGamemode from "./xcomGamemode";
import Tile from "./tile";

export default async function(game: Game) {
	if(game.isClient) {
		await ImageResource.queueImage("./data/sprites/spritesheet.json")
		.queueImage("./data/egg.png")
		.loadImages()
	
		await Tile.loadMetadata("./data/sprites/spritesheet.json")
	
		console.log("loaded images")
		game.gamemode = new XCOMGamemode(game)
	}
}