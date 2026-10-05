import { Injectable, inject } from '@angular/core';
import { Auth, authState, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class XicaAuthService {
  private readonly auth = inject(Auth);

  authState$() {
    return authState(this.auth);
  }

  async login(email: string, senha: string) {
    return signInWithEmailAndPassword(this.auth, email, senha);
  }

  async logout() {
    return signOut(this.auth);
  }

  async recuperarSenha(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }
}
