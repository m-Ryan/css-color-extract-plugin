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
const path_1 = __importDefault(require("path"));
exports.PLUGIN_CALLBACK = 'css-color-extract-plugin-callback';
exports.PLUGIN_NAME = 'css-color-extract-plugin';
class CssColorExtractPlugin {
    constructor(options = {}) {
        this.cacheDatas = [];
        this.jsFileName = '';
        this.jsonFileName = '';
        this.json = false;
        this.injectToWindow = true;
        this.variableName = '';
        this.callback = (data) => {
            const cacheDatas = this.cacheDatas;
            if (!data.source)
                return;
            const cssData = data.source.replace(/\n/g, '');
            const currentData = cacheDatas.filter((item) => item.fileName === data.fileName)[0];
            if (currentData) {
                currentData.source = cssData;
            }
            else {
                cacheDatas.push({
                    source: cssData,
                    fileName: data.fileName.replace(/(.*)\\(.*)/, '$2'),
                    matchColors: data.matchColors
                });
            }
            if (this.jsFileName) {
                this.emitFile(this.jsFileName, this.getJSContent());
            }
            if (this.jsonFileName) {
                this.emitFile(this.jsonFileName, this.getJSONContent());
            }
        };
        Object.assign(options, { variableName: 'CSS_EXTRACT_COLOR_PLUGIN' });
        if (options.fileName) {
            this.jsFileName = options.fileName + '.js';
        }
        if (options.json) {
            this.json = options.json;
            this.jsonFileName = this.jsFileName.replace(/\.js$/, '.json');
        }
        if (typeof options.injectToWindow !== undefined) {
            this.injectToWindow = !!options.injectToWindow;
        }
        this.variableName = options.variableName;
    }
    apply(compiler) {
        const options = compiler.options;
        const buildPath = path_1.default.resolve(options.output.path, this.jsFileName);
        const buildJsonPath = path_1.default.resolve(options.output.path, this.jsonFileName);
        compiler.hooks.thisCompilation.tap(exports.PLUGIN_NAME, (compilation) => {
            compilation.hooks.normalModuleLoader.tap(exports.PLUGIN_NAME, (loaderContext, m) => {
                if (!this.emitFile) {
                    this.emitFile = loaderContext.emitFile;
                }
                loaderContext[exports.PLUGIN_CALLBACK] = this.callback;
            });
        });
        compiler.hooks.compilation.tap(exports.PLUGIN_NAME, (compilation) => {
            compilation.hooks.normalModuleLoader.tap(exports.PLUGIN_NAME, (loaderContext, m) => {
                loaderContext[exports.PLUGIN_CALLBACK] = this.callback;
            });
            html_webpack_plugin_1.default.getHooks(compilation).beforeAssetTagGeneration.tapAsync(exports.PLUGIN_NAME, (data, cb) => __awaiter(this, void 0, void 0, function* () {
                if (this.injectToWindow && this.jsFileName) {
                    data.assets.js.unshift(data.assets.publicPath + this.jsFileName);
                }
                cb(null, data);
            }));
            html_webpack_plugin_1.default.getHooks(compilation).afterTemplateExecution.tapAsync(exports.PLUGIN_NAME, (data, cb) => __awaiter(this, void 0, void 0, function* () {
                const writeFile = (name, data) => new Promise((resolve) => compiler.outputFileSystem.writeFile(name, data, resolve));
                if (this.injectToWindow) {
                    if (!this.jsFileName) {
                        data.bodyTags.unshift({
                            tagName: 'script',
                            closeTag: true,
                            innerHTML: this.getJSContent()
                        });
                    }
                    else {
                        yield writeFile(buildPath, this.getJSContent());
                    }
                }
                if (this.json) {
                    yield writeFile(buildJsonPath, this.getJSONContent());
                }
                cb(null, data);
            }));
        });
    }
    getJSContent() {
        return `window.${this.variableName} = ${JSON.stringify(this.cacheDatas)};`;
    }
    getJSONContent() {
        return JSON.stringify(this.cacheDatas);
    }
}
CssColorExtractPlugin.loader = require.resolve('./loader');
exports.default = CssColorExtractPlugin;
