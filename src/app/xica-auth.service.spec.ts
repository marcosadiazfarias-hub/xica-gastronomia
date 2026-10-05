import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Auth, authState, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { XicaAuthService } from './xica-auth.service';

const authSubject = new BehaviorSubject<any>(null);

vi.mock('@angular/fire/auth', () => ({
  Auth: class MockAuth {},
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  authState: vi.fn(() => authSubject.asObservable()),
  sendPasswordResetEmail: vi.fn(),
}));

describe('XicaAuthService', () => {
  beforeEach(() => {
    authSubject.next(null);
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: Auth, useValue: {} }],
    });
  });

  it('logs in with the provided credentials', async () => {
    vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({} as any);
    const service = TestBed.inject(XicaAuthService);

    await service.login('admin@xica.com', '123456');

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'admin@xica.com', '123456');
  });

  it('logs out the authenticated user', async () => {
    vi.mocked(signOut).mockResolvedValueOnce(undefined);
    const service = TestBed.inject(XicaAuthService);

    await service.logout();

    expect(signOut).toHaveBeenCalled();
  });

  it('sends a password reset email', async () => {
    vi.mocked(sendPasswordResetEmail).mockResolvedValueOnce(undefined);
    const service = TestBed.inject(XicaAuthService);

    await service.recuperarSenha('admin@xica.com');

    expect(sendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(), 'admin@xica.com');
  });

  it('exposes the auth state observable', () => {
    const service = TestBed.inject(XicaAuthService);
    const subscription = service.authState$().subscribe(user => {
      expect(user).toBeNull();
    });

    subscription.unsubscribe();
    expect(authState).toHaveBeenCalled();
  });
});
