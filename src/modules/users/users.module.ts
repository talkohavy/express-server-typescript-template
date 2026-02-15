import { PermissionCheckerService } from '../../lib/permissions';
import { UserUtilitiesController } from './controllers/user-utilities.controller';
import { UsersCrudController } from './controllers/users-crud.controller';
import { UsersController } from './controllers/users.controller';
import { UsersMiddleware } from './middleware/users.middleware';
import { buildUsersPermissionRules } from './permissions/users.permissions';
import { UsersPostgresRepository } from './repositories/users.postgres.repository';
import { FieldScreeningService } from './services/field-screening.service';
import { UserUtilitiesService } from './services/user-utilities.service';
import { UsersCrudService } from './services/users-crud.service';
import type { IUsersRepository } from './repositories/interfaces/users.repository.base';
// import { UsersMongoRepository } from './repositories/users.mongo.repository';

export class UsersModule {
  private usersRepository!: IUsersRepository;
  private usersCrudService!: UsersCrudService;
  private userUtilitiesService!: UserUtilitiesService;
  private permissionCheckerService!: PermissionCheckerService;

  constructor(private readonly app: any) {
    this.initializeModule();
  }

  private initializeModule(): void {
    // Initialize repositories
    // this.usersRepository = new UsersMongoRepository(this.app.mongo);
    this.usersRepository = new UsersPostgresRepository(this.app.pg);

    // Initialize helper services
    const fieldScreeningService = new FieldScreeningService(['hashed_password'], ['nickname']);

    // Initialize main services
    this.userUtilitiesService = new UserUtilitiesService(this.usersRepository, fieldScreeningService);
    this.usersCrudService = new UsersCrudService(this.usersRepository);

    const config = { rules: buildUsersPermissionRules() };
    this.permissionCheckerService = new PermissionCheckerService(config);

    // Only attach routes if running as a standalone micro-service
    if (process.env.IS_STANDALONE_MICRO_SERVICES) {
      this.attachControllers();
    }
  }

  private attachControllers(): void {
    const userUtilitiesController = new UserUtilitiesController(this.app, this.userUtilitiesService);
    const usersCrudController = new UsersCrudController(this.app, this.usersCrudService, this.permissionCheckerService);

    const usersController = new UsersController(userUtilitiesController, usersCrudController);
    const usersMiddleware = new UsersMiddleware(this.app);

    usersMiddleware.use();
    usersController.registerRoutes();
  }

  get services() {
    return {
      usersCrudService: this.usersCrudService,
      userUtilitiesService: this.userUtilitiesService,
    };
  }
}
