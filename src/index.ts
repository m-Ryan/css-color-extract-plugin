import { Compiler } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { IcssItem } from './loader';
import path from 'path';

export const PLUGIN_CALLBACK = 'css-color-extract-plugin-callback';
export const PLUGIN_NAME = 'css-color-extract-plugin';

export default class CssColorExtractPlugin {
	private cacheDatas: CacheData[] = [];
	private emitFile: IEmitFile;
	private jsFileName: string = '';
	private json: boolean = false;
	private variableName: string = '';
	static loader: string = require.resolve('./loader');

	constructor(options: IOptions = {}) {
		Object.assign(options, { variableName: 'CSS_EXTRACT_COLOR_PLUGIN' });
		// 如果传入 fileName ，则写入js文件，否则写在body
		if (options.fileName) {
			this.jsFileName = options.fileName + '.js';
		}
		if (options.fileName) {
			this.jsFileName = options.fileName + '.js';
		}
		if (options.json) {
			this.json = options.json;
		}
		this.variableName = options.variableName;
	}

	callback = (data: IcssItem) => {
		const cacheDatas = this.cacheDatas;
		if (!data.source) return;
		const cssData = data.source.replace(/\n/g, '');

		const currentData = cacheDatas.filter((item) => item.fileName === data.fileName)[0];
		if (currentData) {
			currentData.source = cssData;
		} else {
			cacheDatas.push({
				source: cssData,
				fileName: data.fileName.replace(/(.*)\\(.*)/, '$2'), // 只要文件名
				matchColors: data.matchColors
			});
		}

		if (this.jsFileName) {
			this.emitFile(this.jsFileName, this.getJSContent());
		}
	};

	apply(compiler: Compiler) {
		const options = compiler.options;
		const buildPath = path.resolve(options.output.path, this.jsFileName);
		const buildJsonPath = path.resolve(options.output.path, this.jsFileName.replace(/\.js$/, '.json'));

		compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
			compilation.hooks.normalModuleLoader.tap(PLUGIN_NAME, (loaderContext, m) => {
				if (!this.emitFile) {
					this.emitFile = loaderContext.emitFile;
				}
				loaderContext[PLUGIN_CALLBACK] = this.callback;
			});
		});

		compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
			// 需要再次赋值的原因是 mini-css-extract-plugin 会影响到 thisCompilation 的赋值
			compilation.hooks.normalModuleLoader.tap(PLUGIN_NAME, (loaderContext, m) => {
				loaderContext[PLUGIN_CALLBACK] = this.callback;
			});

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
				const writeFile = (name: string, data: string) =>
					new Promise((resolve) => compiler.outputFileSystem.writeFile(name, data, resolve));

				await writeFile(buildPath, this.getJSContent());
				if (this.json) {
					await writeFile(buildJsonPath, this.getJSONContent());
				}

				cb(null, data);
			});
		});
	}

	getJSContent() {
		return `window.${this.variableName} = ${JSON.stringify(this.cacheDatas)};`;
	}

	getJSONContent() {
		return JSON.stringify(this.cacheDatas);
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
	fileName?: string;
	variableName?: string;
	json?: boolean;
}

interface CacheData {
	source: string;
	fileName: string;
	matchColors: string[];
}
