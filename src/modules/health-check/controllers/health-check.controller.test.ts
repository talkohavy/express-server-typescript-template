import express, { type Application } from 'express';
import request from 'supertest';
import { API_PATHS, StatusCodes } from '../../../common/constants';
import { HealthCheckController } from './health-check.controller';

describe('HealthCheckController', () => {
  let app: Application;

  beforeEach(() => {
    app = express() as unknown as Application;

    app.logger = {
      info: jest.fn(),
      error: jest.fn(),
    } as any;

    const controller = new HealthCheckController(app);
    controller.registerRoutes();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return status OK when health check endpoint is called', async () => {
    const response = await request(app).get(API_PATHS.healthCheck);

    expect(response.status).toBe(StatusCodes.OK);
    expect(response.body).toEqual({ status: 'OK' });
    expect(app.logger.info).toHaveBeenCalledWith(`GET ${API_PATHS.healthCheck} - performing health check`);
  });
});
