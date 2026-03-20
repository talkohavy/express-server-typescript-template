import { API_PATHS } from '../../../../common/constants';
import { ServiceNames } from '../../../../configurations';
import type { CreateUserDto, UpdateUserDto } from '../../../users/services/interfaces/users.service.interface';
import type { DatabaseUser } from '../../../users/types';
import type { HttpClient } from '../../logic/http-client';
import type { IUsersAdapter } from './users.adapter.interface';

export class UsersHttpAdapter implements IUsersAdapter {
  constructor(private readonly httpClient: HttpClient) {}

  async createUser(data: CreateUserDto): Promise<DatabaseUser> {
    const response = await this.httpClient.post<DatabaseUser>({
      serviceName: ServiceNames.Users,
      route: API_PATHS.users,
      body: data,
    });

    return response;
  }

  async getUserById(userId: string): Promise<DatabaseUser> {
    const route = `${API_PATHS.users}/${userId}`;

    const response = await this.httpClient.get<DatabaseUser>({ serviceName: ServiceNames.Users, route: route });

    return response;
  }

  async getUsers(query?: any): Promise<Array<DatabaseUser>> {
    const response = await this.httpClient.get<Array<DatabaseUser>>({
      serviceName: ServiceNames.Users,
      route: API_PATHS.users,
      options: { queryParams: query },
    });

    return response;
  }

  async getUserByEmail(email: string): Promise<DatabaseUser | null> {
    const response = await this.httpClient.post<DatabaseUser | null>({
      serviceName: ServiceNames.Users,
      route: API_PATHS.getUserByEmail,
      body: { email },
    });

    return response;
  }

  async updateUserById(userId: string, data: UpdateUserDto): Promise<DatabaseUser> {
    const route = `${API_PATHS.users}/${userId}`;

    const response = await this.httpClient.patch<DatabaseUser>({
      serviceName: ServiceNames.Users,
      route: route,
      body: data,
    });

    return response;
  }

  async deleteUserById(userId: string): Promise<{ success: boolean }> {
    const route = `${API_PATHS.users}/${userId}`;

    const response = await this.httpClient.delete<{ success: boolean }>({
      serviceName: ServiceNames.Users,
      route: route,
    });

    return response;
  }
}
