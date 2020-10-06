import GameTicker from "./gameTicker";
import Network from "../network/network";
import ClientNetwork from "../network/clientNetwork";
import ServerNetwork from "../network/serverNetwork";
import GameRenderer from "../render/gameRenderer";
import Debug from "./debug";
import GameCollision from "../collision/gameCollision";
import Gamemode from "./gamemode";
import Client from "../network/client";
import RemoteGroup from "../network/remoteGroup";

export default class Game {
	// how my system of versioning works:
	// string is in the front with the in-house name of the game. colon separates the game name from the version
    // first digit indicates major release, which contains significant game changing features that may significantly alter the meta of the game or how the game is played. this digit is meant to give some cadence to the version system, and is purely for publicity
    // second digit indicates a minor release, which may have multiple bug fixes. minor releases, especially during the pre-release versions, will basically be incremented completely arbitrarily
	// third digit increments by 1 for every gameplay test we do that has changed code from the last. sort of works like a revision versioning system. this digit resets for every minor release
	// example, politics:0.0.1
	// version is stored in the game config
	public version: string = "xcom:0.0.0"

	public ticker: GameTicker = new GameTicker(this)
	public renderer: GameRenderer
	public collision: GameCollision
	public isClient: boolean // whether or not this is a client build
	public isServer: boolean // whether or not this is a server build
	public network: ClientNetwork | ServerNetwork

	public gamemode: Gamemode

	public client: Client

	public debug: Debug

	constructor(isClient: boolean) {
		this.isClient = isClient
		this.isServer = !isClient

		if(isClient) {
			this.network = new ClientNetwork(this)
			this.renderer = new GameRenderer(this)
			this.collision = new GameCollision(this)

			this.debug = new Debug(this)

			// little fun message in the console
			let image = new Image()
			image.onload = () => {
				let xScale = 1.25
				let yScale = 0.5
				
				console.log("%c ", "font-size: 1px; padding: " + Math.floor(image.height * yScale / 2) + "px " + Math.floor(image.width * xScale / 2) + "px; background: url('https://bansheerubber.com/egg.png'); background-size: " + (image.width * xScale) + "px " + (image.height * yScale) + "px; color: transparent; background-repeat: no-repeat;")
				
				console.log(`%cpowered by eggine mk3 (${this.version})`, "font-size: 15pt; font-weight: bold;")
				console.log("%cwith love, bansheerubber", "font-style: italic; text-align: center;")
			}
			image.src = "https://bansheerubber.com/egg.png"
		}
		else {
			this.network = new ServerNetwork(this)
		}

		new RemoteGroup(this, 0) // create our default remote group

		Network.setGame(this)
	}

	/**
	 * starts the ticker
	 */
	public start(): void {
		this.ticker.start()
	}

	/**
	 * stops the ticker
	 */
	public stop(): void {
		this.ticker.stop()
	}
}