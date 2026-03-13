import { API_URLS, StatusCodes } from '../../../../common/constants';
import { joiBodyMiddleware } from '../../../../middlewares/joi-body.middleware';
import { createDragonSchema } from './dto/createDragonSchema.dto';
import { updateDragonSchema } from './dto/updateDragonSchema.dto';
import type { ControllerFactory } from '../../../../lib/lucky-server';
import type { IDragonsAdapter } from '../adapters/dragons.adapter.interface';
import type { Application, Request, Response } from 'express';

export class DragonsController implements ControllerFactory {
  constructor(
    private readonly app: Application,
    private readonly dragonsAdapter: IDragonsAdapter,
  ) {}

  registerRoutes() {
    this.createDragon();
    this.getDragons();
    this.getDragonById();
    this.updateDragon();
    this.deleteDragon();
  }

  private createDragon() {
    this.app.post(API_URLS.dragons, joiBodyMiddleware(createDragonSchema), async (req: Request, res: Response) => {
      const { body } = req;

      this.app.logger.info(`POST ${API_URLS.dragons} - creating new dragon`);

      const newDragon = await this.dragonsAdapter.createDragon(body);

      res.status(StatusCodes.CREATED).json(newDragon);
    });
  }

  private getDragons() {
    this.app.get(API_URLS.dragons, async (_req, res) => {
      this.app.logger.info(`GET ${API_URLS.dragons} - fetching dragons`);

      const dragons = await this.dragonsAdapter.getDragons();

      res.json(dragons);
    });
  }

  private getDragonById() {
    this.app.get(API_URLS.dragonById, async (req: Request, res: Response) => {
      const { params } = req;

      this.app.logger.info(`GET ${API_URLS.dragonById} - fetching dragon by ID`);

      const dragonId = params.dragonId!;

      const dragon = await this.dragonsAdapter.getDragonById(dragonId);

      if (!dragon) {
        this.app.logger.error('Dragon not found', dragonId);

        return void res.status(StatusCodes.NOT_FOUND).json({ message: 'Dragon not found' });
      }

      res.json(dragon);
    });
  }

  private updateDragon() {
    this.app.patch(API_URLS.dragonById, joiBodyMiddleware(updateDragonSchema), async (req: Request, res: Response) => {
      const { body, params } = req;

      this.app.logger.info(`PATCH ${API_URLS.dragonById} - updating dragon by ID`);

      const dragonId = params.dragonId!;
      const updatedDragon = await this.dragonsAdapter.updateDragon(dragonId, body);

      if (!updatedDragon) {
        this.app.logger.error('Dragon not found', dragonId);

        return void res.status(StatusCodes.NOT_FOUND).json({ message: 'Dragon not found' });
      }

      res.json(updatedDragon);
    });
  }

  private deleteDragon() {
    this.app.delete(API_URLS.dragonById, async (req: Request, res: Response) => {
      const { params } = req;

      this.app.logger.info(`DELETE ${API_URLS.dragonById} - deleting dragon by ID`);

      const dragonId = params.dragonId!;
      const deletedDragon = await this.dragonsAdapter.deleteDragon(dragonId);

      if (!deletedDragon) {
        this.app.logger.error('Dragon not found', dragonId);

        return void res.status(StatusCodes.NOT_FOUND).json({ message: 'Dragon not found' });
      }

      res.json({ message: 'Dragon deleted successfully' });
    });
  }
}
