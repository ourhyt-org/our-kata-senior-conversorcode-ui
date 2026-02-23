import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

const getSessionMock = jest.fn();
const signInWithPasswordMock = jest.fn();
const signOutMock = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getSession: getSessionMock,
      signInWithPassword: signInWithPasswordMock,
      signOut: signOutMock,
      onAuthStateChange: jest.fn(),
    },
  }),
}));

describe('AuthService', () => {
  beforeEach(() => {
    getSessionMock.mockResolvedValue({ data: { session: null } });
    signOutMock.mockResolvedValue({ error: null });
    signInWithPasswordMock.mockReset();
    TestBed.resetTestingModule();
  });

  it('sets session and access token after login', async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: {
        session: {
          access_token: 'token-123',
          user: { id: 'user-1', email: 'user@example.com' },
        },
      },
      error: null,
    });

    const service = TestBed.configureTestingModule({}).inject(AuthService);

    await service.login('user@example.com', 'password');

    expect(service.isAuthenticated()).toBe(true);
    expect(service.accessToken()).toBe('token-123');
    expect(service.user()?.email).toBe('user@example.com');
  });
});
