import { AuthProviderConfig, AuthUser, LoginParams } from "./types"

export class AuthService {

  private provider: AuthProviderConfig | null = null
  private user: AuthUser | null = null

  /** Centralized internal user state update to keep logic in one place. */
  private setUser(user: AuthUser | null) {
    this.user = user
  }


  async setup(provider: AuthProviderConfig) {
    this.provider = provider
    await this.getIdentity()
    return this
  }

  private checkSetup() {
    if (!this.provider) {
      throw new Error('Auth Service: Provider is not setup')
    }
  }

  async login(params: LoginParams) {
    this.checkSetup()
    const result = await this.provider!.login!(params)
    if (result.success) {
      this.setUser(result.user ?? null)
    }
    return result
  }

  async logout() {
    this.checkSetup()
    const result = await this.provider!.logout()
    if (result.success) {
      this.setUser(null)
    }
    return result
  }

  check() {
    this.checkSetup()
    return { isAuthenticated: !!this.user }
  }

  async getIdentity(): Promise<AuthUser | null> {
    this.checkSetup()
    if (this.user) {
      return this.user
    }
    const result = await this.provider!.getIdentity()
    if (result) {
      this.setUser(result)
    }
    return result ?? null
  }

}

const appAuth = new AuthService()

export { appAuth }