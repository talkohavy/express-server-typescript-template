export type NullishFalsy = undefined | null | false;

export type ModuleConstructor = new (app: any) => any;

export type PluginFn = (app: any) => void;
export type PluginAsyncFn = (app: any) => Promise<void>;
