import Physical from "./physical";
import Vector from "../helpers/vector";

export default abstract class MovingPhysical extends Physical {
	abstract setVelocity(input: Vector): void
	abstract getVelocity(): Vector
}