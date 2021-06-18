export * from './utils';
export * from './request';
export * from './app';

export interface InternalAppBuildIntegrationContext {}

export interface InternalAppBuildContext {}

export interface BaseEZApp {}

export interface IDEOptions {}

export interface AppOptions {
  ide?: IDEOptions;
}

export interface BuildAppOptions {}

export interface BaseAppBuilder {}

export interface EnvelopContext {}

export interface EnvelopResolvers extends Record<string, any> {}

export interface BuildContextArgs {}
