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
const css_1 = __importDefault(require("css"));
const loader_utils_1 = __importDefault(require("loader-utils"));
const postcss_1 = __importDefault(require("postcss"));
const index_1 = require("./index");
function pitch(source) {
    const options = loader_utils_1.default.getOptions(this);
    if (typeof options.only === 'undefined')
        options.only = true;
    if (!(Array.isArray(options.colors) && options.colors.every((item) => typeof item === 'string'))) {
        throw new Error('colors 需要是一个数组');
    }
    const resourcePath = this.resourcePath;
    if (options.modules && !options.localIdentName) {
        throw new Error('css modules 必须提供 localIdentName');
    }
    this.addDependency(this.resourcePath);
    const matchColors = [];
    const parseCssObject = css_1.default.parse(source);
    parseCssObject.stylesheet.rules = parseCssObject.stylesheet.rules
        .map((rule, index) => {
        if (rule.type === 'rule') {
            const currentRule = rule;
            currentRule.declarations = currentRule.declarations.filter((declaration) => declaration.type === 'declaration' && getIsTheme(declaration.value, options.colors, matchColors));
            if (currentRule.declarations.length === 0)
                rule = null;
        }
        else if (rule.type === 'keyframes') {
            rule.keyframes = rule.keyframes.filter((item) => {
                if (item.type === 'keyframe') {
                    let keyframe = item;
                    keyframe.declarations = keyframe.declarations.filter((declaration) => declaration.type === 'declaration' &&
                        getIsTheme(declaration.value, options.colors, matchColors));
                    return keyframe.declarations.length > 0;
                }
                return false;
            });
            if (rule.keyframes.length === 0)
                rule = null;
        }
        else if (rule.type === 'media') {
            rule.rules = rule.rules.filter((rule) => {
                if (rule.type === 'rule') {
                    const currentRule = rule;
                    currentRule.declarations = currentRule.declarations.filter((declaration) => declaration.type === 'declaration' &&
                        getIsTheme(declaration.value, options.colors, matchColors));
                    return currentRule.declarations.length > 0;
                }
            });
            if (rule.rules.length === 0)
                rule = null;
        }
        else if (rule.type === 'comment' || rule.type === 'charset') {
            return null;
        }
        return rule;
    })
        .filter((item) => !!item);
    const childCompiler = this._compilation.createChildCompiler(`${index_1.PLUGIN_NAME} ${source}`);
    childCompiler.hooks.thisCompilation.tap(`${index_1.PLUGIN_NAME} loader`, (compilation) => {
        compilation.hooks.normalModuleLoader.tap(`${index_1.PLUGIN_NAME} loader`, (loaderContext, module) => {
            loaderContext.emitFile = this.emitFile;
        });
    });
    const callback = this.async();
    childCompiler.runAsChild((err, entries, compilation) => __awaiter(this, void 0, void 0, function* () {
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
        const getCss = () => __awaiter(this, void 0, void 0, function* () {
            if (!options.modules)
                return css_1.default.stringify(parseCssObject);
            const cssSource = options.only ? css_1.default.stringify(parseCssObject) : source;
            const pscc = yield postcss_1.default([
                require('postcss-modules')({
                    generateScopedName: options.localIdentName,
                    getJSON: () => { }
                })
            ]).process(cssSource, { from: resourcePath });
            return pscc.css;
        });
        let callbackSource = yield getCss();
        this[index_1.PLUGIN_CALLBACK]({
            source: callbackSource,
            fileName: resourcePath,
            modules: options.modules,
            localIdentName: options.localIdentName,
            matchColors
        });
        return callback(null, source);
    }));
}
exports.default = pitch;
function getIsTheme(declaration, colors, matchColors) {
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
