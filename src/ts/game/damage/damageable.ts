export abstract class Damageable {
	public maxHealth: number
	public health: number = this.maxHealth

	// whether or not the specified attacker can attack this damageable or not
	abstract canDamage(attacker: Damageable): boolean
}