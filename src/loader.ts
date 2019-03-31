import css from 'css';
import loaderUtils from 'loader-utils';
import { PLUGIN_NAME, PLUGIN_CALLBACK } from './index';

export default function pitch(source: string) {
	const options = loaderUtils.getOptions(this) as IcssOptions;
	const context = this.context;
	const resourcePath = this.resourcePath;
	if (options.modules && !options.localIdentName) {
		throw new Error('css modules 必须提供 localIdentName');
	}
	this.addDependency(this.resourcePath);

	const parseCssObject = css.parse(source);
	parseCssObject.stylesheet.rules.forEach((rule, index) => {
		if (rule.type === 'rule') {
			const currentRule = rule as css.Rule;

			currentRule.declarations = currentRule.declarations.filter(
				(declaration: css.Declaration) =>
					declaration.type === 'declaration' && getIsTheme(declaration.value, options.colors)
			);
		} else if (rule.type === 'keyframes') {
			(rule as css.KeyFrames).keyframes = (rule as css.KeyFrames).keyframes.filter((item) => {
				if (item.type === 'keyframe') {
					let keyframe = item as css.KeyFrame;

					keyframe.declarations = keyframe.declarations.filter(
						(declaration: css.Declaration) =>
							declaration.type === 'declaration' && getIsTheme(declaration.value, options.colors)
					);
					return keyframe.declarations.length > 0;
				}
				return false;
			});
		} else if (rule.type === 'media') {
			(rule as css.Media).rules = (rule as css.Media).rules.filter((rule) => {
				if (rule.type === 'rule') {
					const currentRule = rule as css.Rule;

					currentRule.declarations = currentRule.declarations.filter(
						(declaration: css.Declaration) =>
							declaration.type === 'declaration' && getIsTheme(declaration.value, options.colors)
					);
					return currentRule.declarations.length > 0;
				}
			});
		}
	});

	const childCompiler = this._compilation.createChildCompiler(`${PLUGIN_NAME} ${source}`);
	childCompiler.hooks.thisCompilation.tap(`${PLUGIN_NAME} loader`, (compilation) => {
		compilation.hooks.normalModuleLoader.tap(`${PLUGIN_NAME} loader`, (loaderContext, module) => {
			loaderContext.emitFile = this.emitFile;
			loaderContext[PLUGIN_CALLBACK] = false;
		});
	});

	const callback = this.async();
	childCompiler.runAsChild((err, entries, compilation) => {
		if (err) return callback(err);

		if (compilation.errors.length > 0) {
			return callback(compilation.errors[0]);
		}
		compilation.fileDependencies.forEach((dep) => {
			this.addDependency(dep);
		}, this);
		compilation.contextDependencies.forEach((dep) => {
			this.addContextDependency(dep);
		}, this);

		let callbackSource = options.only ? css.stringify(parseCssObject) : source;

		this[PLUGIN_CALLBACK]({
			source: callbackSource,
			resourcePath,
			modules: options.modules,
			localIdentName: options.localIdentName
		});

		let resultSource = options.only ? source + `\n/* extracted by ${PLUGIN_NAME}*/` : '';
		return callback(null, resultSource);
	});
}

function getIsTheme(declaration: string, colors: string[]) {
	return colors.some((color) => declaration.includes(color));
}
export interface IcssOptions {
	colors: string[];
	only: boolean;
	modules: boolean;
	localIdentName?: string;
}

export interface IcssItem {
	source: string;
	resourcePath: string;
	modules: boolean;
	localIdentName?: string;
}
