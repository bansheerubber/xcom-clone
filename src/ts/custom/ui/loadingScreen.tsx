import * as React from "react"

export default class LoadingScreenUI extends React.Component {
	render(): JSX.Element {
		return <div className="loading-screen">
			<div className="loading-bar" />
		</div>
	}
}