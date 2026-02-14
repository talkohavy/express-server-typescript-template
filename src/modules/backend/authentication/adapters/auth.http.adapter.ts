import { API_URLS } from '../../../../common/constants';
import { ServiceNames } from '../../../../configurations';
import type { HttpClient } from '../../logic/http-client';
import type { IAuthAdapter, Tokens, DecodedToken } from './auth.adapter.interface';

export class AuthHttpAdapter implements IAuthAdapter {
  constructor(private readonly httpClient: HttpClient) {}

  async generateHashedPassword(rawPassword: string, salt: string): Promise<string> {
    const response = await this.httpClient.post<string>({
      serviceName: ServiceNames.Auth,
      route: API_URLS.auth,
      body: { rawPassword, salt },
    });

    return response;
  }

  async getIsPasswordValid(hashedPassword: string, password: string): Promise<boolean> {
    const response = await this.httpClient.post<boolean>({
      serviceName: ServiceNames.Auth,
      route: API_URLS.isPasswordValid,
      body: { hashedPassword, password },
    });

    return response;
  }

  async createTokens(userId: string, role: string): Promise<Tokens> {
    const response = await this.httpClient.post<Tokens>({
      serviceName: ServiceNames.Auth,
      route: API_URLS.createTokens,
      body: { userId, role },
    });

    return response;
  }

  async verifyToken(token: string): Promise<DecodedToken> {
    const response = await this.httpClient.post<DecodedToken>({
      serviceName: ServiceNames.Auth,
      route: API_URLS.verifyToken,
      body: { token },
    });

    return response;
  }
}
