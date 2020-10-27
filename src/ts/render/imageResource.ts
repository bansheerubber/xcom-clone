import * as PIXI from "pixi.js"

// helps load images using PixiJS
export default class ImageResource {
	public static queueImage(imageURL: string) {
		PIXI.Loader.shared.add(imageURL)
		return this
	}

	public static async loadImages() {
		return new Promise((resolve, reject) => {
			PIXI.Loader.shared.load(resolve)
		})
	}

	public static getSpriteTextures(resource: string): PIXI.ITextureDictionary {
		return PIXI.Loader.shared.resources[resource].textures
	}
}