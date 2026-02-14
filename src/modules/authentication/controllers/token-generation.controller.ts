import { API_URLS } from '../../../common/constants';
import { joiBodyMiddleware } from '../../../middlewares/joi-body.middleware';
import { createTokensSchema } from './dto/create-tokens.dto';
import type { ControllerFactory } from '../../../lib/lucky-server';
import type { TokenGenerationService } from '../services/token-generation.service';
import type { Application, Request, Response } from 'express';

export class TokenGenerationController implements ControllerFactory {
  constructor(
    private readonly app: Application,
    private readonly tokenGenerationService: TokenGenerationService,
  ) {}

  private createTokens() {
    this.app.post(API_URLS.createTokens, joiBodyMiddleware(createTokensSchema), async (req: Request, res: Response) => {
      const { body } = req;

      this.app.logger.info(`POST ${API_URLS.createTokens} - create tokens`);

      const { userId, role } = body;

      const tokens = await this.tokenGenerationService.createTokens({ userId, role });

      res.json(tokens);
    });
  }

  registerRoutes() {
    this.createTokens();
  }
}
