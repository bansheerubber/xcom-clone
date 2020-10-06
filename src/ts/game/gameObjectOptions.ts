export default interface GameObjectOptions {
	/**
	 * whether or not this object can tick
	 */
	canTick?: boolean

	/**
	 * the remote group the object belongs to
	 */
	customRemoteGroupID?: number

	/**
	 * the object's remote id
	 */
	customRemoteID?: number
}