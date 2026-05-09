import fs from 'fs';
import type { SwaggerUiOptions } from 'swagger-ui-express';
import type { StaticSwaggerConfig } from '../logic/swagger.abstract.config';
import type { DropdownOption } from '../types';

export class SwaggerService {
  constructor(private readonly swaggerDocsArr: Array<StaticSwaggerConfig>) {}

  createTopLevelSwaggerConfig(): SwaggerUiOptions {
    const dropdownOptions = this.createDropdownOptions();

    const topLevelSwaggerConfig: SwaggerUiOptions = {
      // customJs: '/swagger.js', // a javascript file that needs to be hosted! (exist inside public)
      customCss: '.opblock-summary-operation-id { white-space: nowrap; }', //'.swagger-ui .topBar { display: none }',
      customCssUrl: '/swaggerDark.css', // a css file that needs to be hosted! (exist inside public)
      explorer: true,
      swaggerOptions: {
        urls: dropdownOptions,
        // operationsSorter: // Read more about this... Function=(a => a). Apply a sort to the operation list of each API. It can be 'alpha' (sort by paths alphanumerically), 'method' (sort by HTTP method) or a function (see Array.prototype.sort() to know how sort function works). Default is the order returned by the server unchanged.
        displayOperationId: true,
        'syntaxHighlight.theme': 'agate', // <--- theme coloring of payloads. Possible options are: "agate"*, "arta", "monokai", "nord", "obsidian", "tomorrow-night"
        filter: true, // <--- Add a filter bar. default value is false. you can set to true, or to a tag's name to have an onload filtering.
        docExpansion: 'list', // <--- Options are: 'list' (default) | 'full' | 'none'. Controls the default expansion setting for the operations and tags
        displayRequestDuration: true, // <--- defaults to false. Controls the display of the request duration (in milliseconds) for "Try it out" requests.
        tryItOutEnabled: true, // <--- defaults to false. if set to true, the "try it out" button would be automatically clicked
        defaultModelsExpandDepth: 1, // defaults to 1. The default expansion depth for models. set to -1 to completely hide models view.
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch', 'options'], // <--- Select which method would even have an "execute" option.
      },
    };

    return topLevelSwaggerConfig;
  }

  /**
   * @description
   * Create JSON files from all swagger configs, to be served statically.
   *
   * Pass in the destination path of the directory, where the files should be created.
   */
  generateSwaggerDocsFromConfigs(destinationPath: string): void {
    this.swaggerDocsArr.forEach((SwaggerConfigClass) => {
      const configInstance = new SwaggerConfigClass();

      const { name, docs } = configInstance;

      const configJsonContent = JSON.stringify(docs);

      const targetFilename = `${destinationPath}/${name}.swagger.json`;

      fs.writeFileSync(targetFilename, configJsonContent);
    });
  }

  private createDropdownOptions(): Array<DropdownOption> {
    const SERVICE_BASE_URL = process.env.SWAGGER_DOCS_BASE_URL ?? 'http://localhost:8004';

    return this.swaggerDocsArr.map((SwaggerConfigClass) => {
      const swaggerConfig = new SwaggerConfigClass();

      const { name } = swaggerConfig;

      const configJsonUrl = `${SERVICE_BASE_URL}/${name}.swagger.json`;

      const dropdownOption: DropdownOption = { name, url: configJsonUrl };

      return dropdownOption;
    });
  }
}
