import { apiRequest } from './httpClient';

export interface SessionUser {
  sub: string;
  username: string;
  displayName: string;
}

export interface IssuedSession {
  accessToken: string;
  expiresAt: string;
  user: SessionUser;
}

export const authApi = {
  login: (username: string, password: string) =>
    apiRequest<IssuedSession>('/auth/login', { method: 'POST', body: { username, password }, auth: false }),
  refresh: () => apiRequest<IssuedSession>('/auth/refresh', { method: 'POST' }),
  me: () => apiRequest<{ user: SessionUser }>('/auth/me'),
};
