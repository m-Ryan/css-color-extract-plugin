"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const css_1 = __importDefault(require("css"));
const loader_utils_1 = __importDefault(require("loader-utils"));
const index_1 = require("./index");
function pitch(source) {
    const options = loader_utils_1.default.getOptions(this);
    const context = this.context;
    const resourcePath = this.resourcePath;
    if (options.modules && !options.localIdentName) {
        throw new Error('css modules 必须提供 localIdentName');
    }
    this.addDependency(this.resourcePath);
    const parseCssObject = css_1.default.parse(source);
    const themeCssObject = css_1.default.parse('');
    const themeRules = themeCssObject.stylesheet.rules;
    parseCssObject.stylesheet.rules.forEach((rule, index) => {
        let isTheme = false;
        if (rule.type === 'rule') {
            const currentRule = rule;
            currentRule.declarations.forEach((declaration) => {
                if (declaration.type === 'declaration') {
                    if (getIsTheme(declaration.value, options.colors)) {
                        isTheme = true;
                    }
                }
            });
        }
        else if (rule.type === 'keyframes') {
            let keyframes = rule.keyframes;
            keyframes.forEach((item) => {
                if (item.type === 'keyframe') {
                    let keyframe = item;
                    keyframe.declarations.forEach((declaration) => {
                        if (declaration.type === 'declaration') {
                            if (getIsTheme(declaration.value, options.colors)) {
                                isTheme = true;
                            }
                        }
                    });
                }
            });
        }
        else if (rule.type === 'media') {
            let media = rule.rules;
            media.forEach((rule) => {
                if (rule.type === 'rule') {
                    const currentRule = rule;
                    currentRule.declarations.forEach((declaration) => {
                        if (declaration.type === 'declaration') {
                            if (getIsTheme(declaration.value, options.colors)) {
                                isTheme = true;
                            }
                        }
                    });
                }
            });
        }
        if (isTheme || !options.only) {
            themeRules.push(rule);
        }
    });
    const childCompiler = this._compilation.createChildCompiler(`${index_1.PLUGIN_NAME} ${source}`);
    childCompiler.hooks.thisCompilation.tap(`${index_1.PLUGIN_NAME} loader`, (compilation) => {
        compilation.hooks.normalModuleLoader.tap(`${index_1.PLUGIN_NAME} loader`, (loaderContext, module) => {
            loaderContext.emitFile = this.emitFile;
            loaderContext[index_1.PLUGIN_CALLBACK] = false;
        });
    });
    const callback = this.async();
    childCompiler.runAsChild((err, entries, compilation) => {
        if (err)
            return callback(err);
        if (compilation.errors.length > 0) {
            return callback(compilation.errors[0]);
        }
        compilation.fileDependencies.forEach((dep) => {
            this.addDependency(dep);
        }, this);
        compilation.contextDependencies.forEach((dep) => {
            this.addContextDependency(dep);
        }, this);
        let callbackSource = options.only ? css_1.default.stringify(themeCssObject) : css_1.default.stringify(parseCssObject);
        this[index_1.PLUGIN_CALLBACK]({
            source: callbackSource,
            resourcePath,
            modules: options.modules,
            localIdentName: options.localIdentName
        });
        let resultSource = options.only ? css_1.default.stringify(parseCssObject) + `\n/* extracted by ${index_1.PLUGIN_NAME}*/` : '';
        return callback(null, resultSource);
    });
}
exports.default = pitch;
function getIsTheme(declaration, colors) {
    return colors.some((color) => declaration.includes(color));
}
