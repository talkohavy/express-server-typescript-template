import { DragonsController } from './controllers/dragons.controller';
import { DragonsService } from './services/dragons.service';
import type { Application } from 'express';

export class DragonsModule {
  private dragonsService!: DragonsService;

  constructor(private readonly app: Application) {
    this.initializeModule();
  }

  private initializeModule(): void {
    this.dragonsService = new DragonsService(this.app.redis.pub);

    // Only attach routes if running as a standalone micro-service
    if (process.env.IS_STANDALONE_MICRO_SERVICES) {
      this.attachControllers(this.app);
    }
  }

  private attachControllers(app: Application): void {
    const dragonsController = new DragonsController(app, this.dragonsService);

    dragonsController.registerRoutes();
  }

  get services() {
    return {
      dragonsService: this.dragonsService,
    };
  }
}
