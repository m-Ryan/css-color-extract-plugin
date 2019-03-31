import { Compiler } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { IcssItem, IcssOptions } from './loader';
import postcss from 'postcss';
export const PLUGIN_CALLBACK = 'css-color-extract-plugin-callback';
export const PLUGIN_NAME = 'css-color-extract-plugin';

export default class CssColorExtractPlugin {
	private cacheDatas: CacheData[] = [];
	private tempData: IcssItem[] = [];
	private emitFile: IEmitFile;
	private jsFileName: string = '';
	private variableName: string = '';
	static loader: string = require.resolve('./loader');

	constructor(options?: IOptions) {
		Object.assign(options, { variableName: 'CSS_EXTRACT_COLOR_PLUGIN' });
		// 如果传入 fileName ，则写入js文件，否则写在body
		if (options.fileName) {
			this.jsFileName = options.fileName + '.js';
		}
		this.variableName = options.variableName;
	}

	apply(compiler: Compiler) {
		const cacheDatas = this.cacheDatas;
		const tempData = this.tempData;

		compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
			compilation.hooks.normalModuleLoader.tap(PLUGIN_NAME, (lc, m) => {
				const loaderContext = lc;
				this.emitFile = loaderContext.emitFile;
				loaderContext[PLUGIN_CALLBACK] = async (data: IcssItem) => {
					const currentData = tempData.filter((item) => item.resourcePath === data.resourcePath)[0];

					if (currentData) {
						currentData.source = data.source;
					} else {
						tempData.push(data);
					}
					while (tempData.length > 0) {
						const currentTemp = tempData.pop();
						const boot = async () => {
							const pscc = await postcss([
								require('postcss-modules')({
									generateScopedName: currentTemp.localIdentName,
									getJSON: () => {}
								})
							]).process(currentTemp.source, { from: currentTemp.resourcePath });
							return pscc.css;
						};
						const cssData = currentTemp.modules ? await boot() : currentTemp.source;

						const currentData = cacheDatas.filter(
							(item) => item.resourcePath === currentTemp.resourcePath
						)[0];

						if (currentData) {
							currentData.data = cssData;
						} else {
							cacheDatas.push({
								data: cssData,
								resourcePath: currentTemp.resourcePath
							});
						}

						if (this.jsFileName) {
							this.emitFile(this.jsFileName, this.getJSContent());
						}
					}
				};
			});
		});

		compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
			HtmlWebpackPlugin.getHooks(
				compilation
			).beforeAssetTagGeneration.tapAsync(PLUGIN_NAME, async (data: BeforeAssetTagGenerationHook, cb) => {
				if (this.jsFileName) {
					data.assets.js.unshift(data.assets.publicPath + this.jsFileName);
				}
				cb(null, data);
			});

			HtmlWebpackPlugin.getHooks(
				compilation
			).afterTemplateExecution.tapAsync(PLUGIN_NAME, async (data: AfterTemplateExecutionHook, cb) => {
				if (!this.jsFileName) {
					data.bodyTags.unshift({
						tagName: 'script',
						closeTag: true,
						innerHTML: this.getJSContent()
					});
				}
				cb(null, data);
			});
		});
	}

	getJSContent() {
		return `window.${this.variableName} = ${JSON.stringify(this.cacheDatas)};
		var styles = document.createElement('style');
		styles.innerHTML = window.${this.variableName}.map((item) => item.source).join('');
		document.body.appendChild(styles);`;
	}
}

interface BeforeAssetTagGenerationHook {
	assets: {
		publicPath: string;
		js: string[];
		css: string[];
		favicon?: string | undefined;
		manifest?: string | undefined;
	};
	outputName: string;
	plugin: HtmlWebpackPlugin;
}

interface AfterTemplateExecutionHook {
	html: string;
	headTags: {
		tagName: string;
		voidTag: boolean;
		attributes?: { [key: string]: string };
	}[];
	bodyTags: {
		tagName: string;
		innerHTML?: string;
		closeTag: boolean;
		voidTag?: undefined;
		attributes?: { [key: string]: string };
	}[];
	outputName: string;
}
interface IEmitFile {
	(name: string, data: string);
}

interface IOptions {
	fileName: string;
	variableName: string;
}

interface CacheData {
	data: string;
	resourcePath: string;
}
