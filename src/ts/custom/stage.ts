const PriorityQueue = require('priorityqueuejs');
import GameObject from "../game/gameObject";
import BinaryFileReader from "../helpers/binaryFileReader";
import BinaryFileWriter from "../helpers/binaryFileWriter";
import { RGBColor } from "../helpers/color";
import Vector from "../helpers/vector";
import Vector3d from "../helpers/vector3d";
import ControllableCamera from "./controllableCamera";
import Team from "./team";
import Tile, { TileSprites, TILE_ADJACENT, TILE_DIAGONAL } from "./tile";
import TileChunk from "./tileChunk";
import TileLight from "./tileLight";
import type UnitActionsUI from "./ui/unitActions";
import Unit from "./units/unit";

type Vector3dUnique = number

enum StageSaveFile {
	VERSION = 1,
	BLANK_TILE = 2**16 - 1,
	REPEAT_TILE = 2**16 - 2
}

export enum StageRotation {
	DEG_0 = 0,
	DEG_90 = 1,
	DEG_180 = 2,
	DEG_270 = 3,
}

export enum StageLayer {
	DEFAULT_LAYER = 5,
	DOT_LAYER = 6,
	OUTLINE_LAYER0 = 7,
	OUTLINE_LAYER1 = 8,
	OUTLINE_LAYER2 = 9,
	OUTLINE_LAYER3 = 10,
	OUTLINE_LAYER4 = 11,
	UNIT_LAYER = 12,
	DEV_LIGHT_LAYER = 13,
	DEV_LIGHT_BOX_LAYER = 14,
	DEV_GHOST_LAYER = 15,
	DEV_GHOST_BOX_LAYER = 16,
}

export default class Stage extends GameObject {
	/**
	 * map for all the chunks in our stage
	 */
	private chunkMap: Map<number, TileChunk> = new Map()

	private chunks: Set<TileChunk> = new Set()

	/**
	 * map for all the tiles in our stage. separated by layers. layer 0 is the main map, additional layers can contain special effects, etc
	 */
	private tileMap: {
		[layer: number]: Map<number, Tile>
	} = {}

	private tiles: Set<Tile> = new Set()

	private units: Set<Unit> = new Set()

	/**
	 * all of the lights
	 */
	private lights: Set<TileLight> = new Set()

	/**
	 * map for all the different lights
	 */
	private lightMap: Map<number, TileLight> = new Map()

	private _rotation: StageRotation = StageRotation.DEG_0
	private selectedTile: Tile
	private selectedTileOutline: Tile
	private _selectedUnit: Unit
	private selectedUnitOutline: Tile
	private maxPosition: Vector3d = new Vector3d(0, 0, 0)
	private unitUI: UnitActionsUI

	public destroy() {
		// destroy lights
		for(let light of new Set(this.lights)) {
			light.destroy()
		}

		// destroy chunks
		for(let chunk of new Set(this.chunks)) {
			chunk.destroy()
		}
		
		// destroy tiles
		for(let tile of new Set(this.tiles)) {
			tile.destroy()
		}

		delete (this.game.renderer.camera as ControllableCamera).stage

		delete this.chunkMap
		delete this.chunks
		delete this.tileMap
		delete this.tiles
		delete this.lights
		delete this.lightMap
	}
	
	public createTile(
		position: Vector3d,
		spriteIndex: number | string = TileSprites.DEFAULT_TILE,
		layer: number = StageLayer.DEFAULT_LAYER,
		tileClass: typeof Tile = Tile
	): Tile {
		if(!this.tileMap[layer]) {
			this.tileMap[layer] = new Map()
		}
		
		let tile = new tileClass(this.game, this, spriteIndex, layer)
		tile.position = position

		this.tiles.add(tile)

		return tile
	}

	public removeTile(tile: Tile) {
		this.tileMap[tile.layer].delete(tile.position.unique())
		this.tiles.delete(tile)
	}

	public updateTile(tile: Tile, oldPosition: Vector3d, newPosition: Vector3d) {
		let chunkPosition = TileChunk.tileToChunkSpace(tile.position)
		if(!this.chunkMap.get(chunkPosition.unique2d())) {
			let chunk = new TileChunk(this.game, this, chunkPosition)
			this.chunkMap.set(chunkPosition.unique2d(), chunk)
			this.chunks.add(chunk)
		}

		if(!this.tileMap[tile.layer]) {
			this.tileMap[tile.layer] = new Map()
		}

		if(
			this.tileMap[tile.layer].get(newPosition.unique())
			&& this.tileMap[tile.layer].get(newPosition.unique()) != tile
		) {
			this.tileMap[tile.layer].get(newPosition.unique()).destroy()
		}
		
		if(this.tileMap[tile.layer].get(oldPosition.unique()) == tile) {
			this.tileMap[tile.layer].delete(oldPosition.unique())
		}
		this.tileMap[tile.layer].set(newPosition.unique(), tile)

		if(this.chunkMap.get(chunkPosition.unique2d()) != tile.getChunk()) {
			if(tile.getChunk()) {
				tile.getChunk().remove(tile)
			}
			
			this.chunkMap.get(chunkPosition.unique2d()).add(tile)
		}

		if(newPosition.x + 1 > this.maxPosition.x) {
			this.maxPosition.x = tile.position.x + 1
		}

		if(newPosition.y + 1 > this.maxPosition.y) {
			this.maxPosition.y = tile.position.y + 1
		}

		if(newPosition.z + 1 > this.maxPosition.z) {
			this.maxPosition.z = tile.position.z + 1
		}

		if(tile instanceof Unit) {
			this.calculateAllUnits()
		}
	}

	private calculateAllUnits() {
		for(let unit of this.units) {
			unit.movement.calculateRange()
			unit.targeting.calculateTargets()
		}
	}

	public createUnit(
		position: Vector3d,
		unitSprite: string,
		team: Team,
		unitClass: typeof Unit = Unit
	): Unit {
		let spriteIndex = `${unitSprite}1.png`
		let unit = this.createTile(position, spriteIndex, StageLayer.UNIT_LAYER, unitClass) as Unit
		unit.team = team
		unit.baseSprite = unitSprite
		this.units.add(unit)
		this.calculateAllUnits()
		return unit
	}

	public removeUnit(unit: Unit) {
		this.units.delete(unit);
	}

	public addLight(light: TileLight) {
		this.lights.add(light)
		this.updateLight(light, null, light.position)
	}

	public removeLight(light: TileLight) {
		this.lights.delete(light)
		this.lightMap.delete(light.position.unique())
	}

	public updateLight(light: TileLight, oldPosition: Vector3d, position: Vector3d) {
		if(oldPosition) {
			this.lightMap.delete(oldPosition.unique())
		}

		if(position) {
			this.lightMap.set(position.unique(), light)
		}
	}

	public getMapTile(vector: Vector3d, layer = StageLayer.DEFAULT_LAYER): Tile {
		if(vector) {
			return this.tileMap[layer].get(vector.unique())
		}
		else {
			return null
		}
	}

	public getUnit(vector: Vector3d): Unit {
		return this.tileMap[StageLayer.UNIT_LAYER].get(vector.unique()) as Unit
	}

	public getUnits(): IterableIterator<Unit> {
		return this.units.values()
	}

	public getLight(position: Vector3d): TileLight {
		return this.lightMap.get(position.unique())
	}

	public getChunk(vector: Vector3d): TileChunk {
		return this.chunkMap.get(vector.unique2d())
	}

	public removeChunk(chunk: TileChunk) {
		this.chunkMap.delete(chunk.position.unique())
		this.chunks.delete(chunk)
	}

	public selectTile(tile: Tile) {
		if(this.selectedTile) {
			this.selectedTile.unselect()
			this.selectedTile = null
			this.selectedTileOutline?.destroy()
			this.selectedTileOutline = null
		}

		this.selectedTile = tile

		if(this.selectedTile) {
			this.selectedTile.select()
			this.selectedTileOutline = this.createTile(this.selectedTile.position, TileSprites.FULL_OUTLINE, StageLayer.OUTLINE_LAYER0)
		}
	}

	public setUnitUI(unitUI: UnitActionsUI) {
		this.unitUI = unitUI
	}

	public selectUnit(unit: Unit) {
		if(this._selectedUnit) {
			this._selectedUnit.unselect()
			this._selectedUnit = null
			this.selectedUnitOutline?.destroy()
			this.selectedUnitOutline = null
		}

		this._selectedUnit = unit

		if(this._selectedUnit) {
			this._selectedUnit.select()
			this.selectedUnitOutline = this.createTile(this._selectedUnit.position.clone().$add(0, 0, -1), TileSprites.FULL_OUTLINE, StageLayer.OUTLINE_LAYER0)
		}

		this.unitUI?.setUnit(this._selectedUnit)
	}

	get selectedUnit(): Unit {
		return this._selectedUnit
	}

	public getPositionAdjacent(position: Vector3d, index: TILE_ADJACENT): Vector3d {
		if(this.isDestroyed) {
			return
		}
		
		switch(index) {
			// north is negative y
			case TILE_ADJACENT.NORTH: {
				Vector3d.getTempVector(99).copy(position).$add(0, -1, 0)
				break
			}

			// east is positive x
			case TILE_ADJACENT.EAST: {
				Vector3d.getTempVector(99).copy(position).$add(1, 0, 0)
				break
			}

			// south is positive y
			case TILE_ADJACENT.SOUTH: {
				Vector3d.getTempVector(99).copy(position).$add(0, 1, 0)
				break
			}

			// west is negative x
			case TILE_ADJACENT.WEST: {
				Vector3d.getTempVector(99).copy(position).$add(-1, 0, 0)
				break
			}
		}

		if(Vector3d.getTempVector(99).x < 0 || Vector3d.getTempVector(99).y < 0 || Vector3d.getTempVector(99).z < 0) {
			return null
		}
		else {
			return Vector3d.getTempVector(99).clone()	
		}
	}

	public getMapPositionDiagonal(position: Vector3d, index: TILE_DIAGONAL): Vector3d {
		if(this.isDestroyed) {
			return
		}
		
		switch(index) {
			// north is negative y, west is negative x
			case TILE_DIAGONAL.NORTH_WEST: {
				Vector3d.getTempVector(99).copy(position).$add(-1, -1, 0)
				break
			}

			// north is negative y, east is positive x
			case TILE_DIAGONAL.NORTH_EAST: {
				Vector3d.getTempVector(99).copy(position).$add(1, -1, 0)
				break
			}

			// south is positive y, east is positive x
			case TILE_DIAGONAL.SOUTH_EAST: {
				Vector3d.getTempVector(99).copy(position).$add(1, 1, 0)
				break
			}

			// south is positive y, east is negative x
			case TILE_DIAGONAL.SOUTH_WEST: {
				Vector3d.getTempVector(99).copy(position).$add(-1, 1, 0)
				break
			}
		}

		if(Vector3d.getTempVector(99).x < 0 || Vector3d.getTempVector(99).y < 0 || Vector3d.getTempVector(99).z < 0) {
			return null
		}
		else {
			return Vector3d.getTempVector(99).clone()
		}
	}

	/**
	 * find valid neighbors at the specified position.
	 * a valid neighbor is either a position that contains no tile or a position that contains a wall that we can walk into from the side, and not through
	 * @param position 
	 */
	public *getPathfindingNeighbors(position: Vector3d): IterableIterator<Vector3d> {
		let north = this.getPositionAdjacent(position, TILE_ADJACENT.NORTH)
		let west = this.getPositionAdjacent(position, TILE_ADJACENT.WEST)
		let south = this.getPositionAdjacent(position, TILE_ADJACENT.SOUTH)
		let east = this.getPositionAdjacent(position, TILE_ADJACENT.EAST)
		let northWest = this.getMapPositionDiagonal(position, TILE_DIAGONAL.NORTH_WEST)
		let southWest = this.getMapPositionDiagonal(position, TILE_DIAGONAL.SOUTH_WEST)
		let southEast = this.getMapPositionDiagonal(position, TILE_DIAGONAL.SOUTH_EAST)
		let northEast = this.getMapPositionDiagonal(position, TILE_DIAGONAL.NORTH_EAST)

		let northTile = this.getMapTile(north)
		let westTile = this.getMapTile(west)
		let southTile = this.getMapTile(south)
		let eastTile = this.getMapTile(east)
		let northWestTile = this.getMapTile(northWest)
		let southWestTile = this.getMapTile(southWest)
		let southEastTile = this.getMapTile(southEast)
		let northEastTile = this.getMapTile(northEast)

		let currentTile = this.getMapTile(position)
		
		let testWallness = (tile: Tile, comingInto: TILE_ADJACENT | TILE_DIAGONAL): boolean => {
			if(tile.isWall) {
				if(tile.isWallCorner) {
					let table = {
						[TILE_DIAGONAL.NORTH_WEST]: {
							2: TILE_ADJACENT.NORTH,
							3: TILE_DIAGONAL.NORTH_WEST,
							4: TILE_ADJACENT.WEST,
						},
						[TILE_DIAGONAL.SOUTH_WEST]: {
							1: TILE_ADJACENT.SOUTH,
							3: TILE_ADJACENT.WEST,
							4: TILE_DIAGONAL.SOUTH_WEST,
						},
						[TILE_DIAGONAL.SOUTH_EAST]: {
							1: TILE_DIAGONAL.SOUTH_EAST,
							2: TILE_ADJACENT.EAST,
							4: TILE_ADJACENT.SOUTH,
						},
						[TILE_DIAGONAL.NORTH_EAST]: {
							1: TILE_ADJACENT.EAST,
							2: TILE_DIAGONAL.NORTH_EAST,
							3: TILE_ADJACENT.NORTH,
						},
					}
					
					switch(comingInto) {
						case TILE_ADJACENT.NORTH: {
							return tile.rotation != 2 && tile.rotation != 3
						}
	
						case TILE_ADJACENT.EAST: {
							return tile.rotation != 1 && tile.rotation != 2
						}
	
						case TILE_ADJACENT.SOUTH: {
							return tile.rotation != 1 && tile.rotation != 4
						}
	
						case TILE_ADJACENT.WEST: {
							return tile.rotation != 3 && tile.rotation != 4
						}
	
						case TILE_DIAGONAL.NORTH_WEST:
						case TILE_DIAGONAL.SOUTH_WEST:
						case TILE_DIAGONAL.SOUTH_EAST:
						case TILE_DIAGONAL.NORTH_EAST: {
							let check = table[comingInto][tile.rotation]

							if(check == undefined) {
								return true
							}
							else if(check < TILE_DIAGONAL.NORTH_WEST) {
								return !this.getMapTile(this.getPositionAdjacent(position, table[comingInto][tile.rotation]))
							}
							else {
								return check != comingInto
							}
						}
					}
				}
				else {
					let table = {
						[TILE_DIAGONAL.NORTH_WEST]: {
							3: TILE_ADJACENT.NORTH,
							4: TILE_ADJACENT.WEST,
						},
						[TILE_DIAGONAL.SOUTH_WEST]: {
							1: TILE_ADJACENT.SOUTH,
							4: TILE_ADJACENT.WEST,
						},
						[TILE_DIAGONAL.SOUTH_EAST]: {
							1: TILE_ADJACENT.SOUTH,
							2: TILE_ADJACENT.EAST,
						},
						[TILE_DIAGONAL.NORTH_EAST]: {
							2: TILE_ADJACENT.EAST,
							3: TILE_ADJACENT.NORTH,
						},
					}
					
					switch(comingInto) {
						case TILE_ADJACENT.NORTH: {
							return tile.rotation != 3
						}
	
						case TILE_ADJACENT.EAST: {
							return tile.rotation != 2
						}
	
						case TILE_ADJACENT.SOUTH: {
							return tile.rotation != 1
						}
	
						case TILE_ADJACENT.WEST: {
							return tile.rotation != 4
						}

						case TILE_DIAGONAL.NORTH_WEST:
						case TILE_DIAGONAL.SOUTH_WEST:
						case TILE_DIAGONAL.SOUTH_EAST:
						case TILE_DIAGONAL.NORTH_EAST: {
							return  (
								table[comingInto][tile.rotation] == undefined
								|| !this.getMapTile(this.getPositionAdjacent(position, table[comingInto][tile.rotation]))
							)
						}
					}
				}
			}
			return false
		}

		let testCurrentTile = (comingInto: TILE_ADJACENT | TILE_DIAGONAL) => {
			if(currentTile?.isWall) {
				if(currentTile.isWallCorner) {
					let table = {
						[TILE_DIAGONAL.NORTH_WEST]: {
							1: TILE_DIAGONAL.NORTH_WEST,
							2: TILE_ADJACENT.NORTH,
							4: TILE_ADJACENT.WEST,
						},
						[TILE_DIAGONAL.SOUTH_WEST]: {
							1: TILE_ADJACENT.SOUTH,
							2: TILE_DIAGONAL.SOUTH_WEST,
							3: TILE_ADJACENT.WEST,
						},
						[TILE_DIAGONAL.SOUTH_EAST]: {
							2: TILE_ADJACENT.EAST,
							3: TILE_DIAGONAL.SOUTH_EAST,
							4: TILE_ADJACENT.SOUTH,
						},
						[TILE_DIAGONAL.NORTH_EAST]: {
							1: TILE_ADJACENT.EAST,
							3: TILE_ADJACENT.NORTH,
							4: TILE_DIAGONAL.NORTH_EAST,
						},
					}
					
					switch(comingInto) {
						case TILE_ADJACENT.NORTH: {
							return currentTile.rotation != 1 && currentTile.rotation != 4
						}

						case TILE_ADJACENT.WEST: {
							return currentTile.rotation != 1 && currentTile.rotation != 2
						}

						case TILE_ADJACENT.SOUTH: {
							return currentTile.rotation != 2 && currentTile.rotation != 3
						}

						case TILE_ADJACENT.EAST: {
							return currentTile.rotation != 3 && currentTile.rotation != 4
						}

						case TILE_DIAGONAL.NORTH_WEST:
						case TILE_DIAGONAL.SOUTH_WEST:
						case TILE_DIAGONAL.SOUTH_EAST:
						case TILE_DIAGONAL.NORTH_EAST: {
							let check = table[comingInto][currentTile.rotation]
							if(check == undefined) {
								return true
							}
							else if(check < TILE_DIAGONAL.NORTH_WEST) {
								return !this.getMapTile(this.getPositionAdjacent(position, table[comingInto][currentTile.rotation]))
							}
							else {
								return check != comingInto
							}
						}
					}
				}
				else {
					let table = {
						[TILE_DIAGONAL.NORTH_WEST]: {
							1: TILE_ADJACENT.WEST,
							2: TILE_ADJACENT.NORTH,
						},
						[TILE_DIAGONAL.SOUTH_WEST]: {
							2: TILE_ADJACENT.SOUTH,
							3: TILE_ADJACENT.WEST,
						},
						[TILE_DIAGONAL.SOUTH_EAST]: {
							3: TILE_ADJACENT.EAST,
							4: TILE_ADJACENT.SOUTH,
						},
						[TILE_DIAGONAL.NORTH_EAST]: {
							1: TILE_ADJACENT.EAST,
							4: TILE_ADJACENT.NORTH,
						},
					}
					
					switch(comingInto) {
						case TILE_ADJACENT.NORTH: {
							return currentTile.rotation != 1
						}

						case TILE_ADJACENT.WEST: {
							return currentTile.rotation != 2
						}

						case TILE_ADJACENT.SOUTH: {
							return currentTile.rotation != 3
						}

						case TILE_ADJACENT.EAST: {
							return currentTile.rotation != 4
						}

						case TILE_DIAGONAL.NORTH_WEST:
						case TILE_DIAGONAL.SOUTH_WEST:
						case TILE_DIAGONAL.SOUTH_EAST:
						case TILE_DIAGONAL.NORTH_EAST: {
							return (
								table[comingInto][currentTile.rotation] == undefined
								|| !this.getMapTile(this.getPositionAdjacent(position, table[comingInto][currentTile.rotation]))
							)
						}
					}
				}
			}

			return true
		}

		let debug = (tile: Tile, index: TILE_ADJACENT | TILE_DIAGONAL) => {
			if(tile) {
				let colors = {
					0: new RGBColor(0, 0, 0),
					1: new RGBColor(0, 0, 1),
					2: new RGBColor(0, 1, 0),
					3: new RGBColor(0, 1, 1),
					4: new RGBColor(1, 0, 0),
					5: new RGBColor(1, 0, 1),
					6: new RGBColor(1, 1, 0),
					7: new RGBColor(0.5, 0, 0),
				}
				
				tile.tint = colors[index] || new RGBColor(0, 0, 0)
			}
		}

		// adjacents
		if(
			north
			&& (!northTile || testWallness(northTile, TILE_ADJACENT.NORTH))
			&& testCurrentTile(TILE_ADJACENT.NORTH)
		) {
			yield north
		}

		if(
			west
			&& (!westTile || testWallness(westTile, TILE_ADJACENT.WEST))
			&& testCurrentTile(TILE_ADJACENT.WEST)
		) {
			yield west
		}

		if(
			south
			&& (!southTile || testWallness(southTile, TILE_ADJACENT.SOUTH))
			&& testCurrentTile(TILE_ADJACENT.SOUTH)
		) {
			yield south
		}

		if(
			east
			&& (!eastTile || testWallness(eastTile, TILE_ADJACENT.EAST))
			&& testCurrentTile(TILE_ADJACENT.EAST)
		) {
			yield east
		}

		// diagonals
		if(
			northWest
			&& (!northWestTile || testWallness(northWestTile, TILE_DIAGONAL.NORTH_WEST))
			&& testCurrentTile(TILE_DIAGONAL.NORTH_WEST)
		) {
			yield northWest
		}

		if(
			southWest
			&& (!southWestTile || testWallness(southWestTile, TILE_DIAGONAL.SOUTH_WEST))
			&& testCurrentTile(TILE_DIAGONAL.SOUTH_WEST)
		) {
			yield southWest
		}

		if(
			southEast
			&& (!southEastTile || testWallness(southEastTile, TILE_DIAGONAL.SOUTH_EAST))
			&& testCurrentTile(TILE_DIAGONAL.SOUTH_EAST)
		) {
			yield southEast
		}

		if(
			northEast
			&& (!northEastTile || testWallness(northEastTile, TILE_DIAGONAL.NORTH_EAST))
			&& testCurrentTile(TILE_DIAGONAL.NORTH_EAST)
		) {
			yield northEast
		}
	}

	public pathfind(start: Vector3d, end: Vector3d, positions?: Set<Vector3dUnique>): Vector3d[] {
		let calcH = (a: Vector3d, b: Vector3d) => a.dist(b)

		if(
			positions
			&& (!positions.has(end.unique()) || !positions.has(start.unique()))
		) {
			return null
		}

		start = start.clone()
		end = end.clone()
		
		let queue = new PriorityQueue((a, b) => b.h - a.h)
		queue.enq({
			h: calcH(start, end),
			position: start,
		})

		let closeSet: Set<Vector3dUnique> = new Set()
		let cameFrom: Map<Vector3dUnique, Vector3d> = new Map()

		let gScoreMap: Map<Vector3dUnique, number> = new Map()
		let calcG = (a: Vector3d, b: Vector3d) => gScoreMap.get(a.unique()) + a.dist(b)
		gScoreMap.set(start.unique(), 0)

		let fScoreMap: Map<Vector3dUnique, number> = new Map()
		fScoreMap.set(start.unique(), calcH(start, end))
		
		let func = (currentPosition: Vector3d, neighborPosition: Vector3d) => {
			let tempGScore = calcG(currentPosition, neighborPosition)
			if(!gScoreMap.has(neighborPosition.unique()) || tempGScore < gScoreMap.get(neighborPosition.unique())) {
				cameFrom.set(neighborPosition.unique(), currentPosition)
				gScoreMap.set(neighborPosition.unique(), calcG(currentPosition, neighborPosition))
				fScoreMap.set(neighborPosition.unique(), gScoreMap.get(neighborPosition.unique()) + calcH(neighborPosition, end))
				if(
					!closeSet.has(neighborPosition.unique())
					&& (!positions || positions.has(neighborPosition.unique()))
				) {
					queue.enq({
						h: fScoreMap.get(neighborPosition.unique()),
						position: neighborPosition,
					})
				}
			}
		}

		while(queue.size() > 0) {
			let currentPosition: Vector3d = queue.deq().position
			if(currentPosition.equals(end)) {
				let totalPath = [currentPosition]
				while(cameFrom.has(currentPosition.unique())) {
					currentPosition = cameFrom.get(currentPosition.unique())
					totalPath.push(currentPosition)
				}
				return totalPath.reverse()
			}

			closeSet.add(currentPosition.unique())

			for(let neighborPosition of this.getPathfindingNeighbors(currentPosition)) {
				func(currentPosition, neighborPosition)
			}
		}

		return null
	}

	public worldToTileSpace(position: Vector, dontFloor = false): Vector3d {
		let {
			x: worldX,
			y: worldY
		} = position
		
		let angle = Math.PI / 4 + Math.PI / 2 * this.rotation
		worldY += Tile.TILE_BOTTOM_TO_TOP

		// transformation matrix, rotate by 45 degrees and apply sheer and scale of 2 on right column. magic number at the end was needed to adjust scaling of the axes
		let tileX = (worldX * Math.cos(angle) - worldY * (Math.sin(angle) * 2)) / (Tile.TILE_SIZE / 2) * (1000 / 1414)
		let tileY = (worldX * Math.sin(angle) + worldY * (Math.cos(angle) * 2)) / (Tile.TILE_SIZE / 2) * (999 / 1414)
			
		if(dontFloor) {
			return new Vector3d(tileX, tileY, 0)
		}
		else {
			switch(this.rotation) {
				case StageRotation.DEG_90: {
					tileX += 1
					break
				}
	
				case StageRotation.DEG_180: {
					tileX += 1
					tileY += 1
					break
				}
	
				case StageRotation.DEG_270: {
					tileY += 1
					break
				}
			}

			return new Vector3d(tileX, tileY, 0).foreach(Math.floor)
		}
	}

	public tileToWorldSpace(position: Vector3d): Vector {
		let xSpriteSpace, xTileSpace, ySpriteSpace, yTileSpace
		switch(this.rotation) {
			case StageRotation.DEG_0: {
				xSpriteSpace = 1
				xTileSpace = 1
				ySpriteSpace = 1
				yTileSpace = 1
				break
			}

			case StageRotation.DEG_90: {
				xSpriteSpace = -1
				xTileSpace = 1
				ySpriteSpace = 1
				yTileSpace = -1
				break
			}

			case StageRotation.DEG_180: {
				xSpriteSpace = 1
				xTileSpace = -1
				ySpriteSpace = 1
				yTileSpace = -1
				break
			}

			case StageRotation.DEG_270: {
				xSpriteSpace = -1
				xTileSpace = -1
				ySpriteSpace = 1
				yTileSpace = 1
				break
			}
		}
		
		let x = xSpriteSpace * (position.x * xTileSpace * Tile.TILE_SIZE / 2 + position.y * yTileSpace * Tile.TILE_SIZE / 2)
		let y = ySpriteSpace * (position.x * xTileSpace * -Tile.TILE_SIZE / 4 + position.y * yTileSpace * Tile.TILE_SIZE / 4 - position.z * Tile.TILE_HEIGHT)
		return Vector.getTempVector(0).set(x, y)
	}

	public mouseToTileSpace(x: number, y: number): Vector3d {
		let vector = this.worldToTileSpace(this.game.renderer.camera.mouseToWorld(x, y))
		if(vector.x < 0 || vector.y < 0) {
			return null
		}
		else {
			return vector
		}
	}

	public getTileUnderMouse(x: number, y: number): Tile {
		let vector = this.mouseToTileSpace(x, y)
		if(!vector) {
			return null
		}

		let index = vector.unique()

		if(this.tileMap[StageLayer.DEFAULT_LAYER].get(index)) {
			return this.tileMap[StageLayer.DEFAULT_LAYER].get(index)
		}
		else {
			return null
		}
	}

	public selectTileUnderMouse(x: number, y: number) {
		let tile = this.getTileUnderMouse(x, y)
		if(tile) {
			if(tile != this.selectedTile) {
				this.selectTile(tile)
			}
			else {
				this.selectTile(null)
			}
		}
		else {
			this.selectTile(null)
		}
	}

	public set rotation(rotation: StageRotation) {
		let savedCameraTile = this.worldToTileSpace(this.game.renderer.camera.position, true)
		this._rotation = rotation
		this.game.renderer.camera.position.copy(this.tileToWorldSpace(savedCameraTile))

		// TODO improve rotation efficency
		for(let chunk of this.chunks) {
			for(let tile of chunk.tiles) {
				tile.updateRotation()
			}
		}
	}

	public get rotation(): StageRotation {
		return this._rotation
	}

	public save() {
		let file = new BinaryFileWriter("stage.egg")
		file.writeInt16(StageSaveFile.VERSION)
		file.writeByte(this.maxPosition.x)
		file.writeByte(this.maxPosition.y)
		file.writeByte(this.maxPosition.z)

		let rememberedType = -1
		let rememberedTypeCount = 0
		
		// write tiles to file
		let max2dIndex = this.maxPosition.x * this.maxPosition.y
		let maxIndex = this.maxPosition.x * this.maxPosition.y * this.maxPosition.z
		for(let i = 0; i < maxIndex; i++) {
			let position = Vector3d.getTempVector(97).set(
				i % this.maxPosition.x,
				Math.floor(i / this.maxPosition.x) % this.maxPosition.y,
				Math.floor(i / max2dIndex)
			)

			let type = this.getMapTile(position)?.type
			type = type != undefined ? type : StageSaveFile.BLANK_TILE

			// do optimizations for every single time we encounter a new type or when we go up one layer on the z-axis
			if(
				(type != rememberedType && rememberedType != -1)
				|| i % max2dIndex == 0
			) {
				// only do optimizations for counts at or higher than 4 for max efficency
				if(rememberedTypeCount >= 4) {
					file.writeInt16(StageSaveFile.REPEAT_TILE)
					file.writeInt16(rememberedTypeCount)
					file.writeInt16(rememberedType)
				}
				else {
					for(let j = 0; j < rememberedTypeCount; j++) {
						file.writeInt16(rememberedType)
					}
				}

				rememberedTypeCount = 0
				rememberedType = -1
			}

			rememberedType = type
			rememberedTypeCount++
		}

		// dump remaining stuff at the end
		if(rememberedTypeCount >= 4) {
			file.writeInt16(StageSaveFile.REPEAT_TILE)
			file.writeInt16(rememberedTypeCount)
			file.writeInt16(rememberedType)
		}
		else {
			for(let j = 0; j < rememberedTypeCount; j++) {
				file.writeInt16(rememberedType)
			}
		}

		// write lights to file
		file.writeInt16(this.lights.size)
		for(let light of this.lights) {
			light.serialize(file)
		}

		file.saveFile(9)
	}

	public async load(fileName: string) {
		let file = new BinaryFileReader(fileName)
		await file.readFile()

		let version = file.readInt16()
		if(version != StageSaveFile.VERSION) {
			throw new Error(`Incorrect stage save file version, file provided v${version} but expected v${StageSaveFile.VERSION}`)
		}

		let maxX = file.readByte()
		let maxY = file.readByte()
		let maxZ = file.readByte()

		let placeTile = (position, type) => {
			if(type != StageSaveFile.BLANK_TILE) {
				this.createTile(position, type)
			}
		}

		// read tiles
		let max2dIndex = maxX * maxY
		let maxIndex = maxX * maxY * maxZ
		for(let i = 0; i < maxIndex; i++) {
			let position = Vector3d.getTempVector(97).set(
				i % maxX,
				Math.floor(i / maxX) % maxY,
				Math.floor(i / max2dIndex)
			)

			let type = file.readInt16()
			// handle special commands first
			if(type == StageSaveFile.REPEAT_TILE) {
				let count = file.readInt16()
				let type = file.readInt16()

				// place all the repeated tiles we found
				for(let j = 0; j < count; j++) {
					let position = Vector3d.getTempVector(97).set(
						i % maxX,
						Math.floor(i / maxX) % maxY,
						Math.floor(i / max2dIndex)
					)
					
					placeTile(position, type)

					i++
				}
				i--
			}
			else {
				placeTile(position, type)
			}
		}

		// read lights
		let lightCount = file.readInt16()
		let tempColor = new RGBColor(0, 0, 0)
		for(let i = 0; i < lightCount; i++) {
			new TileLight(this.game, this, new Vector3d(0, 0, 0), 0, tempColor).read(file)
		}
	}
}