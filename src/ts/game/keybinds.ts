class Category {
	public items: Keybind[]
	public name: string
	public description: string



	constructor(name: string, description?: string) {
		this.name = name
		this.description = description
	}
}

export class KeybindCategory extends Category {
	public subCategories: KeybindSubCategory[] = []
}

export class KeybindSubCategory extends Category {
	public parent: KeybindCategory


	
	constructor(parent: KeybindCategory, name: string, description?: string) {
		super(name, description)

		this.parent = parent
	}
}

type callback = (event: KeyboardEvent | MouseEvent) => void

export enum KeybindModifier {
	NONE = 0,
	SHIFT = 0b001,
	CONTROL = 0b010,
	ALT = 0b100,
}

export class Keybind {
	public category: KeybindCategory
	public subcategory: KeybindSubCategory
	public name: string = ""
	public description: string = ""
	
	public key: string = ""
	public modifierMask: number = 0

	public pressCallback: callback
	public releaseCallback: callback
	public mouseMoveCallback: callback

	public isPressed: boolean = false

	constructor(key: string, modifier: number, name: string, description?: string, category?: KeybindCategory, subcategory?: KeybindSubCategory)  {
		KeybindController.initIndex(key, modifier)

		KeybindController.map[key][modifier].push(this)

		this.category = category
		this.subcategory = subcategory

		this.name = name
		this.description = description

		this.key = key
		this.modifierMask = modifier
	}

	/**
	 * called when bind is used
	 * @param event
	 */
	public onPress(event: KeyboardEvent | MouseEvent): void {
		if(this.pressCallback && !this.isPressed) {
			this.pressCallback(event)
		}
		this.isPressed = true
	}

	/**
	 * called when bind is released
	 * @param event 
	 */
	public onRelease(event: KeyboardEvent | MouseEvent): void {
		if(this.releaseCallback && this.isPressed) {
			this.releaseCallback(event)
		}
		this.isPressed = false
	}

	/**
	 * called if mouse moves
	 */
	public onMouseMove(event: MouseEvent): void {
		if(this.mouseMoveCallback && this.isPressed) {
			this.mouseMoveCallback(event)
		}
	}

	/**
	 * sets the down callback
	 * @param callback
	 */
	public down(callback: callback): Keybind {
		this.pressCallback = callback
		return this
	}

	/**
	 * sets the up callback
	 * @param callback
	 */
	public up(callback: callback): Keybind {
		this.releaseCallback = callback
		return this
	}

	/**
	 * sets the move callback
	 * @param callback
	 */
	public move(callback: callback): Keybind {
		this.mouseMoveCallback = callback
		KeybindController.mouseMoves.push(this)
		return this
	}
}

export default class KeybindController {
	// map of the key string and key modifier to keybind object
	public static map: { [index: string]: { [index: number]: Keybind[] } } = {}
	public static mouseMoves: Keybind[] = []
	private static lastModifierPress: number = 0
	private static currentKeys: string[] = []



	public static initIndex(key: string, modifier: number): void {
		if(!this.map[key]) {
			this.map[key] = {}
		}

		if(!this.map[key][modifier]) {
			this.map[key][modifier] = []
		}
	}

	public static onPress(event: KeyboardEvent | MouseEvent): void {
		let nodeName = (event.target as HTMLElement).nodeName.toLowerCase()
		if(
			nodeName.indexOf("canvas") == -1
			&& nodeName.indexOf("body") == -1
		) {
			return
		}
		
		// get the key info if we're a keyboard event
		if(event instanceof KeyboardEvent) {
			var hitKey = event.key.toLowerCase()
			var modifierMask = event.altKey as any << 2 | event.ctrlKey as any << 1 | event.shiftKey as any
		}
		// get the mouse info if we're a mouse event
		else {
			var hitKey = `mouse${event.button}`
			var modifierMask = this.lastModifierPress
		}

		// stop the event's key
		for(let keybind of this.getKeybinds(hitKey.toLowerCase(), modifierMask)) {
			keybind.onPress(event)
		}

		// go through all current keys at the current modifier and hit all of them
		for(let key of this.currentKeys) {
			for(let keybind of this.getKeybinds(key, modifierMask)) {
				keybind.onPress(event)
			}	
		}

		if(this.currentKeys.indexOf(hitKey) == -1) {
			this.currentKeys.push(hitKey)
		}
		this.lastModifierPress = modifierMask
	}

	public static onRelease(event: KeyboardEvent | MouseEvent): void {
		// get the key info if we're a keyboard event
		if(event instanceof KeyboardEvent) {
			var hitKey = event.key.toLowerCase()
			var modifierMask = event.altKey as any << 2 | event.ctrlKey as any << 1 | event.shiftKey as any
		}
		// get the mouse info if we're a mouse event
		else {
			var hitKey = `mouse${event.button}`
			var modifierMask = this.lastModifierPress
		}

		// stop the event's key
		for(let keybind of this.getKeybinds(hitKey.toLowerCase(), modifierMask | this.lastModifierPress)) {
			keybind.onRelease(event)
		}

		this.currentKeys.splice(this.currentKeys.indexOf(hitKey), 1)
		// go through all current keys at the current modifier and release all of them
		for(let key of this.currentKeys) {
			let keybinds = this.getKeybinds(key, this.lastModifierPress, modifierMask)
			for(let keybind of keybinds) {
				keybind.onRelease(event)
			}	
		}

		this.lastModifierPress = modifierMask
	}

	public static onMouseMove(event: MouseEvent): void {
		let nodeName = (event.target as HTMLElement).nodeName.toLowerCase()
		if(
			nodeName.indexOf("canvas") == -1
			&& nodeName.indexOf("body") == -1
		) {
			return
		}
		
		for(let keybind of this.mouseMoves) {
			keybind.onMouseMove(event)
		}
	}

	public static getKeybinds(key: string, modifier: number, exclude?: number): Keybind[] {
		let getKeybinds = (key: string, modifier: number): Keybind[] => {
			if(!this.map[key]) {
				return []
			}
			else {
				return this.map[key][modifier] != undefined ? this.map[key][modifier] : []
			}
		}

		// if the modifier has more than one mask on, then combine the different hit bitmasks together (so ctrl + shift + a will trigger the keybind ctrl + a and the keybind ctrl + shift + a for instance)
		if(Math.log2(modifier) % 1 != 0) {
			if(exclude !== 0) {
				var combo = getKeybinds(key, modifier)
			}
			else {
				var combo: Keybind[] = []
			}

			for(let i = 0; i < 3; i++) {
				// checking to see if value is true at a specific location in the bitmask
				if((modifier & (1 << i)) && (exclude === undefined || !(exclude & (1 << i)))) {
					combo = combo.concat(getKeybinds(key, 1 << i))
				}
			}
			return combo
		}
		else if(exclude !== 0) {
			return getKeybinds(key, modifier)
		}
		else {
			return []
		}
	}
}

if(typeof document != "undefined") {
	document.addEventListener("keydown", KeybindController.onPress.bind(KeybindController))
	document.addEventListener("keyup", KeybindController.onRelease.bind(KeybindController))

	document.addEventListener("mousedown", KeybindController.onPress.bind(KeybindController))
	document.addEventListener("mouseup", KeybindController.onRelease.bind(KeybindController))
	document.addEventListener("mousemove", KeybindController.onMouseMove.bind(KeybindController))
}