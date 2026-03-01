import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { config } from '../../config/env';

interface CreateM365UserParams {
  displayName: string;
  mailNickname: string; // username part (e.g. "alan.lfs")
  email: string; // full email (e.g. "alan.lfs@pfigroups.com")
  password: string;
}

interface M365User {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
}

class Microsoft365Service {
  private client: Client | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.init();
  }

  private init(): void {
    const { tenantId, clientId, clientSecret } = config.microsoft365;

    if (!tenantId || !clientId || !clientSecret) {
      console.warn('[M365] Not configured. Set M365_TENANT_ID, M365_CLIENT_ID, M365_CLIENT_SECRET');
      return;
    }

    try {
      const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
      const authProvider = new TokenCredentialAuthenticationProvider(credential, {
        scopes: ['https://graph.microsoft.com/.default'],
      });

      this.client = Client.initWithMiddleware({ authProvider });
      this.isConfigured = true;
      console.log('[M365] Microsoft Graph client initialized');
    } catch (error: any) {
      console.error('[M365] Failed to initialize:', error.message);
    }
  }

  public isReady(): boolean {
    return this.isConfigured && this.client !== null;
  }

  /**
   * Create a new user in Microsoft 365
   */
  async createUser(params: CreateM365UserParams): Promise<M365User> {
    if (!this.client) {
      throw new Error('Microsoft 365 not configured');
    }

    try {
      // Check if user already exists
      const existing = await this.getUserByEmail(params.email);
      if (existing) {
        console.log(`[M365] User ${params.email} already exists, skipping creation`);
        return existing;
      }

      const user = await this.client.api('/users').post({
        accountEnabled: true,
        displayName: params.displayName,
        mailNickname: params.mailNickname,
        userPrincipalName: params.email,
        passwordProfile: {
          forceChangePasswordNextSignIn: true,
          password: params.password,
        },
        usageLocation: 'ID', // Indonesia
      });

      console.log(`[M365] User created: ${params.email} (ID: ${user.id})`);

      return {
        id: user.id,
        displayName: user.displayName,
        mail: user.mail || params.email,
        userPrincipalName: user.userPrincipalName,
      };
    } catch (error: any) {
      console.error(`[M365] Failed to create user ${params.email}:`, error.message);
      throw new Error(`Failed to create Microsoft 365 account: ${error.message}`);
    }
  }

  /**
   * Check if a user exists by email/UPN
   */
  async getUserByEmail(email: string): Promise<M365User | null> {
    if (!this.client) return null;

    try {
      const user = await this.client.api(`/users/${email}`).get();
      return {
        id: user.id,
        displayName: user.displayName,
        mail: user.mail || email,
        userPrincipalName: user.userPrincipalName,
      };
    } catch (error: any) {
      if (error.statusCode === 404) return null;
      throw error;
    }
  }

  /**
   * Assign a license to a user (e.g. Microsoft 365 Business Basic)
   */
  async assignLicense(userId: string, skuId: string): Promise<void> {
    if (!this.client) {
      throw new Error('Microsoft 365 not configured');
    }

    try {
      await this.client.api(`/users/${userId}/assignLicense`).post({
        addLicenses: [{ skuId, disabledPlans: [] }],
        removeLicenses: [],
      });
      console.log(`[M365] License ${skuId} assigned to user ${userId}`);
    } catch (error: any) {
      console.error(`[M365] Failed to assign license:`, error.message);
      // Don't throw - license assignment failure shouldn't block credential sending
    }
  }
}

export const microsoft365Service = new Microsoft365Service();
