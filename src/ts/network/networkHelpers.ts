import RemoteObject from "./remoteObject";
import { ServerResolve } from "./remoteMethod";

/**
 * wrapper for resolving remote returns on both the client and server. for the server, resolves the first remote return only even if multiple returns should be processed
 * @example
 * await remoteReturn(this, this.func, ...args)
 */
export async function remoteReturn<T>(object: RemoteObject, func: (...args) => T, ...args: any[]): Promise<T> {
	func.apply(object, args)

	if(object.game.isClient) {
		return object.getRemoteReturn()
	}
	else {
		return object.getRemoteReturn().then((values: ServerResolve[]) => {
			return new Promise((resolve, reject) => {
				let {
					value
				} = values[0]
				resolve(value as T)
			})
		})
	}
}