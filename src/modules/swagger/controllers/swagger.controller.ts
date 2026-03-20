import path from 'path';
import express, { type Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import { API_PATHS } from '../../../common/constants';
import type { SwaggerService } from '../services/swagger.service';

export class SwaggerController {
  private pathToSwaggerServeDir = '';

  constructor(
    private readonly app: Application,
    private readonly swaggerService: SwaggerService,
  ) {
    this.pathToSwaggerServeDir = path.join(process.cwd(), process.env.PATH_TO_SWAGGER_SERVE_DIR ?? '');
    this.swaggerService.generateSwaggerDocsFromConfigs(this.pathToSwaggerServeDir);
  }

  private getDocsWebsite() {
    const swaggerServe = swaggerUi.serve;
    const topLevelSwaggerConfig = this.swaggerService.createTopLevelSwaggerConfig();
    const swaggerSetup = swaggerUi.setup(null, topLevelSwaggerConfig); // <--- or, swaggerUi.setup(swaggerDocs, swaggerExtraOptions)

    // MUST be "use"! Not "get", not "all" - just "use"!
    this.app.use(API_PATHS.apiDocs, swaggerServe, swaggerSetup);
  }

  private serveSwaggerConfigs() {
    this.app.use(express.static(this.pathToSwaggerServeDir));
  }

  registerRoutes() {
    this.getDocsWebsite();
    this.serveSwaggerConfigs();
  }
}
