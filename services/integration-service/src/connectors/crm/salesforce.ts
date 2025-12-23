import jsforce from 'jsforce';
import axios from 'axios';
import { config } from '../../config';
import pino from 'pino';

const logger = pino({ name: 'salesforce-connector' });

export class SalesforceConnector {
  async getAuthorizationUrl(state: string, redirectUri: string): Promise<string> {
    const oauth2 = new jsforce.OAuth2({
      loginUrl: config.salesforce.loginUrl,
      clientId: config.salesforce.clientId,
      clientSecret: config.salesforce.clientSecret,
      redirectUri,
    });

    return oauth2.getAuthorizationUrl({ state, scope: 'api refresh_token' });
  }

  async exchangeCodeForTokens(code: string, redirectUri: string) {
    try {
      const oauth2 = new jsforce.OAuth2({
        loginUrl: config.salesforce.loginUrl,
        clientId: config.salesforce.clientId,
        clientSecret: config.salesforce.clientSecret,
        redirectUri,
      });

      const conn = new jsforce.Connection({ oauth2 });
      const userInfo = await conn.authorize(code);

      return {
        accessToken: conn.accessToken!,
        refreshToken: conn.refreshToken,
        instanceUrl: conn.instanceUrl,
        userId: userInfo.id,
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to exchange code for tokens');
      throw new Error('Failed to authenticate with Salesforce');
    }
  }

  async refreshAccessToken(refreshToken: string, instanceUrl: string) {
    try {
      const oauth2 = new jsforce.OAuth2({
        loginUrl: config.salesforce.loginUrl,
        clientId: config.salesforce.clientId,
        clientSecret: config.salesforce.clientSecret,
      });

      const conn = new jsforce.Connection({
        oauth2,
        instanceUrl,
        refreshToken,
      });

      await (conn as any).refresh(refreshToken);

      return {
        accessToken: conn.accessToken!,
        refreshToken: conn.refreshToken,
        instanceUrl: conn.instanceUrl,
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to refresh access token');
      throw new Error('Failed to refresh Salesforce access token');
    }
  }

  async createLead(accessToken: string, instanceUrl: string, lead: any) {
    try {
      const conn = new jsforce.Connection({
        instanceUrl,
        accessToken,
      });

      const result = await conn.sobject('Lead').create(lead);
      return { id: (result as any).id };
    } catch (error: any) {
      logger.error({ error }, 'Failed to create lead');
      throw new Error('Failed to create Salesforce lead');
    }
  }

  async createContact(accessToken: string, instanceUrl: string, contact: any) {
    try {
      const conn = new jsforce.Connection({
        instanceUrl,
        accessToken,
      });

      const result = await conn.sobject('Contact').create(contact);
      return { id: (result as any).id };
    } catch (error: any) {
      logger.error({ error }, 'Failed to create contact');
      throw new Error('Failed to create Salesforce contact');
    }
  }

  async query(accessToken: string, instanceUrl: string, soql: string) {
    try {
      const conn = new jsforce.Connection({
        instanceUrl,
        accessToken,
      });

      const result = await conn.query(soql);
      return result.records;
    } catch (error: any) {
      logger.error({ error }, 'Failed to query');
      throw new Error('Failed to query Salesforce');
    }
  }
}

export const salesforceConnector = new SalesforceConnector();
