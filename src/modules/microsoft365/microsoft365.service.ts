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

export interface M365License {
  skuId: string;
  skuPartNumber: string;
  displayName: string;
  totalUnits: number;
  consumedUnits: number;
  availableUnits: number;
}

export interface M365UserLicense {
  skuId: string;
  skuPartNumber: string;
  displayName: string;
}

// Friendly display names for common SKUs
const skuDisplayNames: Record<string, string> = {
  'O365_BUSINESS_ESSENTIALS': 'Microsoft 365 Business Basic',
  'O365_BUSINESS_PREMIUM': 'Microsoft 365 Business Standard',
  'SPB': 'Microsoft 365 Business Premium',
  'ENTERPRISEPACK': 'Office 365 E3',
  'ENTERPRISEPREMIUM': 'Office 365 E5',
  'SMB_BUSINESS': 'Microsoft 365 Apps for Business',
  'SMB_BUSINESS_ESSENTIALS': 'Microsoft 365 Business Basic',
  'EXCHANGESTANDARD': 'Exchange Online (Plan 1)',
  'EXCHANGEENTERPRISE': 'Exchange Online (Plan 2)',
  'AAD_PREMIUM': 'Azure AD Premium P1',
  'AAD_PREMIUM_P2': 'Azure AD Premium P2',
  'FLOW_FREE': 'Microsoft Power Automate Free',
  'POWER_BI_STANDARD': 'Power BI (Free)',
  'TEAMS_EXPLORATORY': 'Microsoft Teams Exploratory',
  'STREAM': 'Microsoft Stream',
  'VISIOCLIENT': 'Visio Plan 2',
  'VISIOONLINE_PLAN1': 'Visio Plan 1',
  'INTUNE_A': 'Microsoft Intune',
};

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
   * Get available licenses from the tenant
   */
  async getAvailableLicenses(): Promise<M365License[]> {
    if (!this.client) {
      throw new Error('Microsoft 365 not configured');
    }

    try {
      const result = await this.client.api('/subscribedSkus').get();
      const skus = result.value || [];

      return skus
        .filter((sku: any) => sku.capabilityStatus === 'Enabled')
        .map((sku: any) => {
          const total = sku.prepaidUnits?.enabled || 0;
          const consumed = sku.consumedUnits || 0;
          return {
            skuId: sku.skuId,
            skuPartNumber: sku.skuPartNumber,
            displayName: skuDisplayNames[sku.skuPartNumber] || sku.skuPartNumber,
            totalUnits: total,
            consumedUnits: consumed,
            availableUnits: total - consumed,
          };
        })
        .sort((a: M365License, b: M365License) => a.displayName.localeCompare(b.displayName));
    } catch (error: any) {
      console.error('[M365] Failed to get licenses:', error.message);
      throw new Error(`Failed to get Microsoft 365 licenses: ${error.message}`);
    }
  }

  /**
   * Get licenses assigned to a specific user
   */
  async getUserLicenses(email: string): Promise<M365UserLicense[]> {
    if (!this.client) return [];

    try {
      const result = await this.client.api(`/users/${email}/licenseDetails`).get();
      const licenses = result.value || [];

      return licenses.map((lic: any) => ({
        skuId: lic.skuId,
        skuPartNumber: lic.skuPartNumber,
        displayName: skuDisplayNames[lic.skuPartNumber] || lic.skuPartNumber,
      }));
    } catch (error: any) {
      if (error.statusCode === 404) return [];
      console.error(`[M365] Failed to get user licenses for ${email}:`, error.message);
      return [];
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
