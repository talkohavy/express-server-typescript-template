import {
  addIdParamToPath,
  addPageParamToQuery,
  addRequestBody,
  createApiRoute,
  createSwaggerApiDocs,
} from 'api-opener';
import { API_PATHS } from '../../../../common/constants';
import { AbstractSwaggerConfig } from '../../logic/swagger.abstract.config';
import { definitions, USER_REFS } from './user.refs';

export class UsersSwaggerConfig extends AbstractSwaggerConfig {
  constructor() {
    super('Users');

    this.docs = createSwaggerApiDocs({
      title: 'LuckyLove: users-service',
      baseUrl: 'http://localhost:8000',
      definitions,
      routes: [
        // The order of everything here matters!!!
        // #############################
        // ---- SPECIAL CONTROLLERS ----
        // #############################
        // createApiRoute({
        //   method: 'post',
        //   route: '/users-service/users/verb-user/{id}',
        //   tag: 'Special',
        //   summary: 'Verb another user',
        //   description: 'Use to like, block, grant, or watch another user.',
        //   operationId: 'user-verb-user',
        //   parameters: [addIdParamToPath({ objectName: 'user', operationName: 'verb', isPositiveNumber: true })],
        //   requestBody: addRequestBody({
        //     refString: USER_REFS.verb,
        //     description: 'A json with the verbID',
        //     isRequired: true,
        //   }),
        // }),

        // ##########################
        // ---- REST CONTROLLERS ----
        // ##########################
        // Get Many:
        createApiRoute({
          method: 'get',
          route: API_PATHS.users,
          summary: 'Find users by query params',
          parameters: [
            addPageParamToQuery(),
            {
              in: 'query',
              name: 'view',
              description: 'Which view to select',
              schema: { type: 'number', default: 1, enum: [1, 2, 3] },
            },
          ],
          responses: {
            '200': {
              description: 'User deleted successfully',
              content: {
                'application/json': {
                  schema: { $ref: USER_REFS.user },
                },
                'application/x-www-form-urlencoded': {
                  schema: { $ref: USER_REFS.user },
                },
              },
            },
          },
        }),
        // Get One:
        createApiRoute({
          method: 'get',
          route: '/api/users/{id}',
          summary: 'Find users by query params',
          operationId: 'single-user',
          parameters: [addIdParamToPath()],
          responses: {
            '200': {
              description: 'User fetched successfully',
              content: {
                'application/json': {
                  schema: { $ref: USER_REFS.user },
                },
                'application/x-www-form-urlencoded': {},
              },
            },
          },
        }),
        // Post One:
        createApiRoute({
          method: 'post',
          route: API_PATHS.users,
          summary: 'Create new user in db',
          operationId: 'create-user',
          requestBody: addRequestBody({
            refString: USER_REFS.user,
            isRequired: true,
          }),
        }),
        // Patch One:
        createApiRoute({
          method: 'patch',
          route: '/api/users/{id}',
          summary: 'Update user by ID',
          operationId: 'update-user',
          parameters: [addIdParamToPath()],
          responses: {
            '200': {
              description: 'User updated successfully',
              content: {
                'application/json': {
                  schema: { $ref: USER_REFS.user },
                },
                'application/x-www-form-urlencoded': {},
              },
            },
          },
        }),
        // Delete One:
        createApiRoute({
          method: 'delete',
          route: '/api/users/{id}',
          summary: 'Delete user by ID',
          operationId: 'delete-user',
          parameters: [
            addIdParamToPath(),
            {
              in: 'header',
              name: 'userId',
              description: 'Token userId header',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'User deleted successfully',
            },
          },
        }),
      ],
    });
  }
}
