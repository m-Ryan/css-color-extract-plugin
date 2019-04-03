export default function pitch(source: string): void;
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
