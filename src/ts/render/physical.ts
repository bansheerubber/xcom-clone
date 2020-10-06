import Vector from "../helpers/vector";
import Camera from "./camera";

// represents a physical object that has to gaurentee the code certain things, like position, scale, rotation, etc
export default abstract class Physical {
	public rotation: number
	public cameras: Camera[] = []

	abstract setPosition(input: Vector): void
	abstract getPosition(): Vector

	abstract setScale(input: Vector): void
	abstract getScale(): Vector
}