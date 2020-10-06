class Leaf {
	private _children: Set<Leaf> = new Set<Leaf>()
	private _parent: Leaf

	private classReference: any

	constructor(classReference) {
		this.classReference = classReference
	}

	/**
	 * @return class reference of our leaf
	 */
	public getClassReference(): any {
		return this.classReference
	}

	/**
	 * children in our leaf
	 */
	public getChildren(): Set<Leaf> {
		return this._children
	}

	/**
	 * adds a child
	 * @param child
	 */
	public addChild(child: Leaf): void {
		this._children.add(child)
		child.setParent(this)
	}

	/**
	 * removes a child
	 * @param child
	 */
	public removeChild(child: Leaf): void {
		this._children.delete(child)
	}

	/**
	 * set the parent of this leaf
	 * @param parent
	 */
	public setParent(parent: Leaf): void {
		this._parent = parent
	}

	/**
	 * @return parent of this leaf
	 */
	public getParent(): Leaf {
		return this._parent
	}

	/**
	 * iterates up through the tree, yielding each leaf
	 */
	public* parents(): IterableIterator<Leaf> {
		let found: Leaf = this
		while((found = found.getParent()) != undefined) {
			yield found
		}
	}

	/**
	 * iterates down the tree, yielding each child and their child
	 */
	public* children(): IterableIterator<Leaf> {
		// what the fuck is this code
		for(let leaf of this._children) {
			yield leaf

			// recursively yield the bullshit
			for(let leaf2 of leaf.children()) {
				yield leaf2
			}
		}
	}
}

export default class ExtensionTree {
	public static classMap: {
		[index: string]: Leaf
	} = {}
	public static classes: any[] = []
	
	/**
	 * adds a class to the extension tree
	 * @param parentClass super class
	 * @param childClass child class
	 */
	public static addExtendedClass(parentClass: any, childClass: any): void {
		// if the child class already exists in the extension tree, then don't create a new leaf for it
		let childLeaf: Leaf
		if(this.classMap[childClass.name]) {
			childLeaf = this.classMap[childClass.name]
		}
		else {
			childLeaf = new Leaf(childClass)
		}

		// if the parent leaf already exists in the extension tree, then don't create a new leaf for it
		let parentLeaf: Leaf
		if(this.classMap[parentClass.name]) {
			parentLeaf = this.classMap[parentClass.name]
		}
		else {
			parentLeaf = new Leaf(parentClass)
		}

		parentLeaf.addChild(childLeaf)

		this.classMap[parentClass.name] = parentLeaf
		this.classMap[childClass.name] = childLeaf

		this.classes.push(parentClass)
		this.classes.push(childClass)
	}

	/**
	 * finds a leaf based on the specified class
	 * @param inputClass
	 */
	public static getLeaf(inputClass: any): Leaf {
		return this.classMap[inputClass.name]
	}
}