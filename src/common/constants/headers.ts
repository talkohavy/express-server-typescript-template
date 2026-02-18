export const Headers = {
  RequestId: 'x-request-id',
  UserRole: 'x-user-role',
  UserId: 'x-user-id',
  InternalApiKey: 'x-internal-api-key',
} as const;

type AuthorizedHeader = {
  headerName: string;
  type: 'int' | 'string';
  /**
   * @default false
   */
  isEncoded?: boolean;
};

export const USER_PROP_TO_USER_HEADER: Record<string, AuthorizedHeader> = {
  id: { headerName: Headers.UserId, type: 'int' },
  role: { headerName: Headers.UserRole, type: 'string' },
} as const;
