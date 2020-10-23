import * as React from "react";
import { JsxEmit } from "typescript";
import GeoscapeScene from "./geoscapeScene";

interface GeoscapeDatacusProps {
	scene: GeoscapeScene
}

interface GeoscapeDatacusState {
	title: string
	display: boolean
	tick: number
	interval: NodeJS.Timeout
	blackout: boolean
}

export default class GeoscapeDatacus extends React.Component<GeoscapeDatacusProps, GeoscapeDatacusState> {
	private static CHARACTERS_PER_TICK = 150
	private static BORDER_DONE_TICK = 3
	
	/**
	 * adds extra characters onto our current count when we encounter these elements
	 */
	private static EXTRA_TYPE_CHARACTERS = {
		"input": 100,
		"select": 100,
	}
	private static TYPE_BLACKLIST = {
		"select": true,
		"option": true,
	}
	private charactersCounted: number = 0
	private children: JSX.Element = null
	
	constructor(props) {
		super(props)

		this.props.scene.datacus = this

		this.state = {
			title: "",
			display: false,
			tick: -1,
			interval: null,
			blackout: false,
		}
	}

	setChildren(children: JSX.Element) {
		this.children = children
	}

	render(): JSX.Element {
		if(this.state.tick == -1) {
			this.setState({
				tick: 0,
				interval: setInterval(() => {
					this.setState({
						tick: this.state.tick + 1,
					})
					this.forceUpdate()
	
					if(this.state.tick > GeoscapeDatacus.BORDER_DONE_TICK + this.charactersCounted / GeoscapeDatacus.CHARACTERS_PER_TICK / 1.5) {
						clearInterval(this.state.interval)
					}
				}, 100)
			})
		}
		
		let tick = this.state.tick
		let maxCharacters = tick * 1.5 * GeoscapeDatacus.CHARACTERS_PER_TICK - GeoscapeDatacus.BORDER_DONE_TICK * GeoscapeDatacus.CHARACTERS_PER_TICK
		let amountOfCharactersRead = 0

		// animate elements
		let recurse = (element) => {
			if(!element) {
				return element
			}
			
			if(element.props) {
				if(amountOfCharactersRead >= maxCharacters) {
					element.props.className = `${element.props.className || ""} datacus-hidden`.trim()
				}
				else if(element.props.className) {
					element.props.className = element.props.className.replace(/datacus-hidden/g, "").trim()
				}
			}

			// if we were touched by the datacus, then we need to do something special
			if(element.type && GeoscapeDatacus.TYPE_BLACKLIST[element.type.toLowerCase()]) {
				amountOfCharactersRead += GeoscapeDatacus.EXTRA_TYPE_CHARACTERS[element.type.toLowerCase()] || 0
				return element
			}
			else if(element.props?.datacusTouched) {
				element.props.style.color = amountOfCharactersRead < maxCharacters ? "" : "transparent"
				amountOfCharactersRead += element.props.children.length
			}
			else if(typeof element == "string") {
				let array = []
				for(let i = 0; i < element.length; i += GeoscapeDatacus.CHARACTERS_PER_TICK) {
					array.push(<span key={i} style={{
						color: amountOfCharactersRead < maxCharacters ? "" : "transparent"
					}}>{element.substring(i, i + GeoscapeDatacus.CHARACTERS_PER_TICK)}</span>)
					array[array.length - 1].props.datacusTouched = true

					amountOfCharactersRead += element.substring(i, i + GeoscapeDatacus.CHARACTERS_PER_TICK).length
				}
				return array
			}
			else if(Array.isArray(element.props?.children)) {
				element.props.children = recurse(element.props.children)
			}
			else if(Array.isArray(element)) {
				for(let i = 0; i < element.length; i++) {
					element[i] = recurse(element[i])
				}
			}
			else if(element.props?.children) {
				element.props.children = recurse(element.props.children)
			}

			if(element.type && GeoscapeDatacus.EXTRA_TYPE_CHARACTERS[element.type.toLowerCase()]) {
				amountOfCharactersRead += GeoscapeDatacus.EXTRA_TYPE_CHARACTERS[element.type.toLowerCase()]
			}

			element.key = Math.random()
			return element
		}

		let element = recurse(this.children)
		this.charactersCounted = amountOfCharactersRead
		console.log(maxCharacters, tick, this.charactersCounted)
		
		return <>
			<div className="datacus-black-background" style={{
				display: this.state.blackout ? "block" : "none"
			}} />
			<div className="datacus" style={{
				display: this.state.display ? "block" : "none"
			}}>
				<div className="container" style={{
					"borderRight": this.state.tick >= 1 ? "" : "1px solid transparent",
					"borderBottom": this.state.tick >= 2 ? "" : "1px solid transparent",
					"borderLeft": this.state.tick >= 2 ? "" : "1px solid transparent",
					"width": 600,
				}}>
					<span className="title">{this.state.title}</span>
					{element}
				</div>
			</div>
		</>
	}
}