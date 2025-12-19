import axios from 'axios';
import { config } from '../../config';
import pino from 'pino';

const logger = pino({ name: 'hubspot-connector' });

const HUBSPOT_API_BASE = 'https://api.hubapi.com';
const HUBSPOT_OAUTH_BASE = 'https://app.hubspot.com/oauth';

export class HubSpotConnector {
  async getAuthorizationUrl(state: string, redirectUri: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: config.hubspot.clientId,
      redirect_uri: redirectUri,
      scope: 'contacts crm.objects.contacts.read crm.objects.contacts.write crm.objects.companies.read crm.objects.companies.write',
      state,
    });

    return `${HUBSPOT_OAUTH_BASE}/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, redirectUri: string) {
    try {
      const response = await axios.post(`${HUBSPOT_OAUTH_BASE}/v1/token`, new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.hubspot.clientId,
        client_secret: config.hubspot.clientSecret,
        redirect_uri: redirectUri,
        code,
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to exchange code for tokens');
      throw new Error('Failed to authenticate with HubSpot');
    }
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const response = await axios.post(`${HUBSPOT_OAUTH_BASE}/v1/token`, new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: config.hubspot.clientId,
        client_secret: config.hubspot.clientSecret,
        refresh_token: refreshToken,
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to refresh access token');
      throw new Error('Failed to refresh HubSpot access token');
    }
  }

  async createContact(accessToken: string, email: string, firstName?: string, lastName?: string, properties?: Record<string, any>) {
    try {
      const response = await axios.post(
        `${HUBSPOT_API_BASE}/crm/v3/objects/contacts`,
        {
          properties: {
            email,
            firstname: firstName,
            lastname: lastName,
            ...properties,
          },
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return { id: response.data.id };
    } catch (error: any) {
      logger.error({ error }, 'Failed to create contact');
      throw new Error('Failed to create HubSpot contact');
    }
  }

  async updateContact(accessToken: string, contactId: string, properties: Record<string, any>) {
    try {
      const response = await axios.patch(
        `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}`,
        { properties },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return { id: response.data.id };
    } catch (error: any) {
      logger.error({ error }, 'Failed to update contact');
      throw new Error('Failed to update HubSpot contact');
    }
  }

  async getContact(accessToken: string, contactId: string) {
    try {
      const response = await axios.get(
        `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error({ error }, 'Failed to get contact');
      throw new Error('Failed to get HubSpot contact');
    }
  }

  async searchContacts(accessToken: string, query: string) {
    try {
      const response = await axios.post(
        `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`,
        {
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'CONTAINS_TOKEN',
                  value: query,
                },
              ],
            },
          ],
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return response.data.results;
    } catch (error: any) {
      logger.error({ error }, 'Failed to search contacts');
      throw new Error('Failed to search HubSpot contacts');
    }
  }

  async createCompany(accessToken: string, name: string, properties?: Record<string, any>) {
    try {
      const response = await axios.post(
        `${HUBSPOT_API_BASE}/crm/v3/objects/companies`,
        {
          properties: {
            name,
            ...properties,
          },
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return { id: response.data.id };
    } catch (error: any) {
      logger.error({ error }, 'Failed to create company');
      throw new Error('Failed to create HubSpot company');
    }
  }
}

export const hubspotConnector = new HubSpotConnector();
