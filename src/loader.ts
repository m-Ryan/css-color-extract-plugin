import css from 'css';
import loaderUtils from 'loader-utils';
import postcss from 'postcss';
import { PLUGIN_NAME, PLUGIN_CALLBACK } from './index';

export default function pitch(source: string) {
	const options = loaderUtils.getOptions(this) as IcssOptions;
	if (typeof options.only === 'undefined') options.only = true;
	if (!(Array.isArray(options.colors) && options.colors.every((item) => typeof item === 'string'))) {
		throw new Error('colors 需要是一个数组');
	}

	const resourcePath = this.resourcePath;
	if (options.modules && !options.localIdentName) {
		throw new Error('css modules 必须提供 localIdentName');
	}
	this.addDependency(this.resourcePath);
	const matchColors = [];
	const parseCssObject = css.parse(source);
	parseCssObject.stylesheet.rules = parseCssObject.stylesheet.rules
		.map((rule, index) => {
			if (rule.type === 'rule') {
				const currentRule = rule as css.Rule;

				currentRule.declarations = currentRule.declarations.filter(
					(declaration: css.Declaration) =>
						declaration.type === 'declaration' && getIsTheme(declaration.value, options.colors, matchColors)
				);
				if (currentRule.declarations.length === 0) rule = null;
			} else if (rule.type === 'keyframes') {
				(rule as css.KeyFrames).keyframes = (rule as css.KeyFrames).keyframes.filter((item) => {
					if (item.type === 'keyframe') {
						let keyframe = item as css.KeyFrame;

						keyframe.declarations = keyframe.declarations.filter(
							(declaration: css.Declaration) =>
								declaration.type === 'declaration' &&
								getIsTheme(declaration.value, options.colors, matchColors)
						);
						return keyframe.declarations.length > 0;
					}
					return false;
				});

				if ((rule as css.KeyFrames).keyframes.length === 0) rule = null;
			} else if (rule.type === 'media') {
				(rule as css.Media).rules = (rule as css.Media).rules.filter((rule) => {
					if (rule.type === 'rule') {
						const currentRule = rule as css.Rule;

						currentRule.declarations = currentRule.declarations.filter(
							(declaration: css.Declaration) =>
								declaration.type === 'declaration' &&
								getIsTheme(declaration.value, options.colors, matchColors)
						);
						return currentRule.declarations.length > 0;
					}
				});
				if ((rule as css.Media).rules.length === 0) rule = null;
			} else if (rule.type === 'comment' || rule.type === 'charset') {
				return null;
			}
			return rule;
		})
		.filter((item) => !!item);

	const childCompiler = this._compilation.createChildCompiler(`${PLUGIN_NAME} ${source}`);
	childCompiler.hooks.thisCompilation.tap(`${PLUGIN_NAME} loader`, (compilation) => {
		compilation.hooks.normalModuleLoader.tap(`${PLUGIN_NAME} loader`, (loaderContext, module) => {
			loaderContext.emitFile = this.emitFile;
		});
	});

	const callback = this.async();
	childCompiler.runAsChild(async (err, entries, compilation) => {
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

		const getCss = async () => {
			if (!options.modules) return css.stringify(parseCssObject);
			const cssSource = options.only ? css.stringify(parseCssObject) : source;
			const pscc = await postcss([
				require('postcss-modules')({
					generateScopedName: options.localIdentName,
					getJSON: () => {}
				})
			]).process(cssSource, { from: resourcePath });
			return pscc.css;
		};

		let callbackSource = await getCss();

		(this[PLUGIN_CALLBACK] as (cssItem: IcssItem) => any)({
			source: callbackSource,
			fileName: resourcePath,
			modules: options.modules,
			localIdentName: options.localIdentName,
			matchColors
		});

		return callback(null, source);
	});
}

function getIsTheme(declaration: string, colors: string[], matchColors: string[]) {
	let hasThemeColor = false;
	colors.forEach((color) => {
		if (declaration.includes(color)) {
			hasThemeColor = true;
			if (!matchColors.some((declaration) => declaration === color)) {
				matchColors.push(color);
			}
		}
	});
	return hasThemeColor;
}

export interface IcssOptions {
	colors: string[];
	only: boolean;
	modules: boolean;
	localIdentName?: string;
}

export interface IcssItem {
	source: string;
	fileName: string;
	modules: boolean;
	localIdentName?: string;
	matchColors: string[];
}
