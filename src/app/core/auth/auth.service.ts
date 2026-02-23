import { Injectable, signal } from '@angular/core';
import { Session, SupabaseClient, User, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase: SupabaseClient = createClient(
    environment.SUPABASE_URL,
    environment.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    },
  );

  private readonly sessionSignal = signal<Session | null>(null);
  private readonly userSignal = signal<User | null>(null);
  private readonly accessTokenSignal = signal<string | null>(null);

  readonly session = this.sessionSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly accessToken = this.accessTokenSignal.asReadonly();

  constructor() {
    void this.restoreSession();
    this.supabase.auth.onAuthStateChange((_, session) => {
      this.setSession(session);
    });
  }

  isAuthenticated(): boolean {
    return !!this.accessTokenSignal();
  }

  async restoreSession(): Promise<void> {
    const { data } = await this.supabase.auth.getSession();
    this.setSession(data.session ?? null);
  }

  async login(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
    this.setSession(data.session ?? null);
  }

  async logout(): Promise<void> {
    await this.supabase.auth.signOut();
    this.setSession(null);
  }

  private setSession(session: Session | null): void {
    this.sessionSignal.set(session);
    this.userSignal.set(session?.user ?? null);
    this.accessTokenSignal.set(session?.access_token ?? null);
  }
}
