import Game from "../game/game";

export default async function(game: Game) {
	if(game.isClient) {
		console.log("hey")
	}
}