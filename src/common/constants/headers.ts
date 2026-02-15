export const HEADERS = {
  RequestId: 'x-request-id',
  UserRole: 'x-user-role',
  UserId: 'x-user-id',
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
  id: { headerName: HEADERS.UserId, type: 'int' },
  role: { headerName: HEADERS.UserRole, type: 'string' },
} as const;
