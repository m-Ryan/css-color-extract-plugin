import { Compiler } from 'webpack';
export declare const PLUGIN_CALLBACK = "css-color-extract-plugin-callback";
export declare const PLUGIN_NAME = "css-color-extract-plugin";
export default class CssColorExtractPlugin {
    private cacheDatas;
    private emitFile;
    private jsFileName;
    private variableName;
    static loader: string;
    constructor(options?: IOptions);
    apply(compiler: Compiler): void;
    getJSContent(): string;
}
interface IOptions {
    fileName?: string;
    variableName?: string;
}
export {};
