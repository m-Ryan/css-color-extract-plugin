import { Compiler } from 'webpack';
import { IcssItem } from './loader';
export declare const PLUGIN_CALLBACK = "css-color-extract-plugin-callback";
export declare const PLUGIN_NAME = "css-color-extract-plugin";
export default class CssColorExtractPlugin {
    private cacheDatas;
    private emitFile;
    private jsFileName;
    private json;
    private variableName;
    static loader: string;
    constructor(options?: IOptions);
    callback: (data: IcssItem) => void;
    apply(compiler: Compiler): void;
    getJSContent(): string;
    getJSONContent(): string;
}
interface IOptions {
    fileName?: string;
    variableName?: string;
    json?: boolean;
}
export {};
