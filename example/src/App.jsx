import React, { Component } from 'react';
import styles from './App.module.scss';
import { SketchPicker } from 'react-color';

function replaceColor(source, color, replaceColor) {
	return source.replace(new RegExp(`(:.*?\\s*)(${color})(\\b.*?)(?=})`, 'mig'), (group) => {
		return group.replace(new RegExp(`${color}`, 'mig'), replaceColor);
	});
}

const PRIMARY_COLOR = '#1890ff';

class App extends Component {
	async setColor(color) {
		const styleData = window.CSS_EXTRACT_COLOR_PLUGIN || [];
		const cssText = styleData.map((item) => item.source).join('');
		const styleText = replaceColor(cssText, PRIMARY_COLOR, color);
		const style = document.createElement('style');
		style.innerHTML = styleText;
		document.body.appendChild(style);
	}
	render() {
		return (
			<div className={styles['example']}>
				<SketchPicker onChangeComplete={(colorResult) => this.setColor(colorResult.hex)} />
			</div>
		);
	}
}

export default App;
