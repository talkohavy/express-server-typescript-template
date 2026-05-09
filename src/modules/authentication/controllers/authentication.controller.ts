import type { ControllerFactory } from '@src/lib/lucky-server';
import type { PasswordManagementController } from './password-management.controller';
import type { SessionManagementController } from './session-management.controller';
import type { TokenGenerationController } from './token-generation.controller';
import type { TokenVerificationController } from './token-verification.controller';

export class AuthenticationController implements ControllerFactory {
  constructor(
    private readonly passwordManagementController: PasswordManagementController,
    private readonly tokenGenerationController: TokenGenerationController,
    private readonly tokenVerificationController: TokenVerificationController,
    private readonly sessionManagementController: SessionManagementController,
  ) {}

  registerRoutes() {
    this.passwordManagementController.registerRoutes();
    this.tokenGenerationController.registerRoutes();
    this.tokenVerificationController.registerRoutes();
    this.sessionManagementController.registerRoutes();
  }
}
