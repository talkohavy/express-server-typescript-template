import type { ModuleConstructor, NullishFalsy, PluginAsyncFn, PluginFn } from './types';

export class AppFactory {
  private registeredModules: any[] = [];
  private registeredPlugins: PluginFn[] = [];

  constructor(
    private readonly app: any,
    optimizedApp = {},
  ) {
    Object.assign(this.app, optimizedApp);
  }

  /**
   * Should be called after plugins are registered.
   *
   * @param modules - The modules to register.
   */
  registerModules(modules: (ModuleConstructor | NullishFalsy)[]): void {
    modules.forEach((Module) => {
      if (!Module) return;

      const moduleInstance = new Module(this.app);
      this.registeredModules.push(moduleInstance);
      this.app.modules[Module.name] = moduleInstance;
    });
  }

  /**
   * Should be called before modules are registered.
   *
   * @param plugins - The plugins to register.
   */
  async registerPlugins(plugins: (PluginFn | PluginAsyncFn | NullishFalsy)[]): Promise<void> {
    for (const plugin of plugins) {
      if (!plugin) continue;

      this.registeredPlugins.push(plugin);
      await plugin(this.app);
    }
  }

  /**
   * Should be called after modules are registered.
   *
   * @param errorHandler - The error handler to register.
   */
  registerErrorHandler(errorHandler: PluginFn | PluginAsyncFn): void {
    errorHandler(this.app);
  }

  /**
   * Should be called after modules are registered.
   *
   * @param pathNotFoundHandler - The path not found handler to register.
   */
  registerPathNotFoundHandler(pathNotFoundHandler: PluginFn): void {
    pathNotFoundHandler(this.app);
  }
}
