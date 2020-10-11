import Vector3d from "../helpers/vector3d";
import Stage, { StageLayer } from "./stage";
import Tile from "./tile";

interface TileRaycastReturn {
	/**
	 * the tile we hit
	 */
	tile: Tile

	/**
	 * the position we hit
	 */
	position: Vector3d

	/**
	 * the normal we hit
	 */
	normal: Vector3d
}

export default class TileRaycast {
	public static tiles: Set<Tile> = new Set()
	
	
	
	public static cast(stage: Stage, start: Vector3d, end: Vector3d, ignore: Tile[] = [], useTemps: boolean = false, debug: boolean = false): TileRaycastReturn {
		if(debug) {
			for(let tile of this.tiles) {
				tile.destroy()
			}
			this.tiles.clear()
		}
		
		let distance = Math.ceil(start.dist(end))
		let testPosition

		let calcNormal = (position: Vector3d) => {
			// determine the normal
			let delta = Vector3d.getTempVector(52).set(
				start.x - end.x,
				start.y - end.y,
				start.z - end.z,
			)
			let deltaAbs = Vector3d.getTempVector(53).copy(delta).foreach(Math.abs)

			let highestComponent = ""
			if(
				deltaAbs.x >= deltaAbs.y
				&& deltaAbs.x >= deltaAbs.z
			) {
				highestComponent = "x"
			}
			else if(
				deltaAbs.y >= deltaAbs.x
				&& deltaAbs.y >= deltaAbs.z
			) {
				highestComponent = "y"
			}
			else if(
				deltaAbs.z >= deltaAbs.x
				&& deltaAbs.z >= deltaAbs.y
			) {
				highestComponent = "z"
			}

			// (value - start) / (end - start) = percent
			let highestDelta = delta[highestComponent]
			let lastPosition = start.lerp(
				end,
				(position[highestComponent] + 0.501 * Math.floor(highestDelta / Math.abs(highestDelta)) - start[highestComponent])
					/ (end[highestComponent] - start[highestComponent])
			).foreach(Math.round)
			return lastPosition.sub(position).unit() 
		}

		for(let i = 0; i <= distance; i++) {
			testPosition = start.lerpUnit(end, i)
			testPosition.set(Math.round(testPosition.x), Math.round(testPosition.y), Math.round(testPosition.z))
			testPosition = testPosition.clone()

			if(debug) {
				this.tiles.add(stage.createTile(testPosition, 268, StageLayer.DEV_LIGHT_BOX_LAYER))
			}
			
			let tile
			if((tile = stage.getMapTile(testPosition)) && ignore.indexOf(tile) == -1) {
				if(useTemps) {
					return {
						tile,
						position: Vector3d.getTempVector(201).copy(testPosition),
						normal: calcNormal(testPosition),
					}
				}
				else {
					return {
						tile,
						position: Vector3d.getTempVector(201).copy(testPosition).clone(),
						normal: calcNormal(testPosition).clone(),
					}
				}
			}
		}

		return null
	}
}