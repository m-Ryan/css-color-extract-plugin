"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const html_webpack_plugin_1 = __importDefault(require("html-webpack-plugin"));
const postcss_1 = __importDefault(require("postcss"));
exports.PLUGIN_CALLBACK = 'css-color-extract-plugin-callback';
exports.PLUGIN_NAME = 'css-color-extract-plugin';
class CssColorExtractPlugin {
    constructor(options) {
        this.cacheDatas = [];
        this.tempData = [];
        this.jsFileName = '';
        this.variableName = '';
        Object.assign(options, { variableName: 'CSS_EXTRACT_COLOR_PLUGIN' });
        if (options.fileName) {
            this.jsFileName = options.fileName + '.js';
        }
        this.variableName = options.variableName;
    }
    apply(compiler) {
        const cacheDatas = this.cacheDatas;
        const tempData = this.tempData;
        compiler.hooks.thisCompilation.tap(exports.PLUGIN_NAME, (compilation) => {
            compilation.hooks.normalModuleLoader.tap(exports.PLUGIN_NAME, (lc, m) => {
                const loaderContext = lc;
                this.emitFile = loaderContext.emitFile;
                loaderContext[exports.PLUGIN_CALLBACK] = (data) => __awaiter(this, void 0, void 0, function* () {
                    const currentData = tempData.filter((item) => item.resourcePath === data.resourcePath)[0];
                    if (currentData) {
                        currentData.source = data.source;
                    }
                    else {
                        tempData.push(data);
                    }
                    while (tempData.length > 0) {
                        const currentTemp = tempData.pop();
                        const boot = () => __awaiter(this, void 0, void 0, function* () {
                            const pscc = yield postcss_1.default([
                                require('postcss-modules')({
                                    generateScopedName: currentTemp.localIdentName
                                })
                            ]).process(currentTemp.source, { from: currentTemp.resourcePath });
                            return pscc.css;
                        });
                        const cssData = currentTemp.modules ? yield boot() : currentTemp.source;
                        const currentData = cacheDatas.filter((item) => item.resourcePath === currentTemp.resourcePath)[0];
                        if (currentData) {
                            currentData.data = cssData;
                        }
                        else {
                            cacheDatas.push({
                                data: cssData,
                                resourcePath: currentTemp.resourcePath
                            });
                        }
                        if (this.jsFileName) {
                            this.emitFile(this.jsFileName, this.getJSContent());
                        }
                    }
                });
            });
        });
        compiler.hooks.compilation.tap(exports.PLUGIN_NAME, (compilation) => {
            html_webpack_plugin_1.default.getHooks(compilation).beforeAssetTagGeneration.tapAsync(exports.PLUGIN_NAME, (data, cb) => __awaiter(this, void 0, void 0, function* () {
                if (this.jsFileName) {
                    data.assets.js.unshift(data.assets.publicPath + this.jsFileName);
                }
                cb(null, data);
            }));
            html_webpack_plugin_1.default.getHooks(compilation).afterTemplateExecution.tapAsync(exports.PLUGIN_NAME, (data, cb) => __awaiter(this, void 0, void 0, function* () {
                if (!this.jsFileName) {
                    data.bodyTags.unshift({
                        tagName: 'script',
                        closeTag: true,
                        innerHTML: this.getJSContent()
                    });
                }
                cb(null, data);
            }));
        });
    }
    getJSContent() {
        return `window.${this.variableName} = ${JSON.stringify(this.cacheDatas)};
		var styles = document.createElement('style');
		styles.innerHTML = window.${this.variableName}.map((item) => item.source).join('');
		document.body.appendChild(styles);`;
    }
}
CssColorExtractPlugin.loader = require.resolve('./loader');
exports.default = CssColorExtractPlugin;
