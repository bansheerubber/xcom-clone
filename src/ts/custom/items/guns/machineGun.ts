import Gun, { SHOT_TYPE } from "./gun";

export default class MachineGun extends Gun {
	public name = "Machine Gun"
	public accuracies = {
		[SHOT_TYPE.ACCURATE] : 0.60,
		[SHOT_TYPE.SNAPSHOT] : 0.30,
		[SHOT_TYPE.AUTO] : 0.20,
	}
	public aps = {
		[SHOT_TYPE.ACCURATE] : 20,
		[SHOT_TYPE.SNAPSHOT] : 10,
		[SHOT_TYPE.AUTO] : 10,
	}
	public isAuto = true
	public missRadius = 5
}