import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../../config';
import pino from 'pino';

const logger = pino({ name: 'google-ads-connector' });

const oauth2Client = new OAuth2Client(
  config.googleAds.clientId,
  config.googleAds.clientSecret,
  config.oauth.callbackBaseUrl + '/google-ads'
);

export class GoogleAdsConnector {
  async getAuthorizationUrl(state: string): Promise<string> {
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/adwords'],
      state,
      prompt: 'consent',
    });

    return url;
  }

  async exchangeCodeForTokens(code: string) {
    try {
      const { tokens } = await oauth2Client.getToken(code);
      return {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || undefined,
        expiresIn: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to exchange code for tokens');
      throw new Error('Failed to authenticate with Google Ads');
    }
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await oauth2Client.refreshAccessToken();

      return {
        accessToken: credentials.access_token!,
        refreshToken: credentials.refresh_token || refreshToken,
        expiresIn: credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : 3600,
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to refresh access token');
      throw new Error('Failed to refresh Google Ads access token');
    }
  }

  // Note: Google Ads API requires additional setup with customer IDs and developer token
  // This is a simplified implementation showing the OAuth flow
  // For full functionality, use the @google-ads/api-client library
}

export const googleAdsConnector = new GoogleAdsConnector();
