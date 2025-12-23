import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { IntegrationProvider } from '@prisma/client';
import { tiktokConnector } from '../connectors/social/tiktok';
import { metaConnector } from '../connectors/social/meta';
import { youtubeConnector } from '../connectors/social/youtube';
import { hubspotConnector } from '../connectors/crm/hubspot';
import { salesforceConnector } from '../connectors/crm/salesforce';
import { shopifyConnector } from '../connectors/ecommerce/shopify';
import { googleAdsConnector } from '../connectors/ads/google-ads';
import pino from 'pino';

const logger = pino({ name: 'oauth-service' });

export class OAuthService {
  async initiateOAuth(
    userId: string,
    provider: IntegrationProvider,
    redirectUri: string,
    metadata?: any
  ): Promise<{ authUrl: string; state: string }> {
    try {
      // Create OAuth state
      const state = uuidv4();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await prisma.oAuthState.create({
        data: {
          state,
          provider,
          userId,
          redirectUri,
          metadata,
          expiresAt,
        },
      });

      // Get authorization URL based on provider
      let authUrl: string;

      switch (provider) {
        case IntegrationProvider.TIKTOK:
          authUrl = await tiktokConnector.getAuthorizationUrl(state, redirectUri);
          break;
        case IntegrationProvider.INSTAGRAM:
        case IntegrationProvider.FACEBOOK:
          authUrl = await metaConnector.getAuthorizationUrl(
            state,
            redirectUri,
            ['public_profile', 'email', 'pages_show_list', 'pages_read_engagement', 'instagram_basic', 'instagram_content_publish']
          );
          break;
        case IntegrationProvider.YOUTUBE:
          authUrl = await youtubeConnector.getAuthorizationUrl(state);
          break;
        case IntegrationProvider.HUBSPOT:
          authUrl = await hubspotConnector.getAuthorizationUrl(state, redirectUri);
          break;
        case IntegrationProvider.SALESFORCE:
          authUrl = await salesforceConnector.getAuthorizationUrl(state, redirectUri);
          break;
        case IntegrationProvider.SHOPIFY:
          if (!(metadata as any).shop) {
            throw new Error('Shopify shop domain is required');
          }
          authUrl = await shopifyConnector.getAuthorizationUrl((metadata as any).shop, state, redirectUri);
          break;
        case IntegrationProvider.GOOGLE_ADS:
          authUrl = await googleAdsConnector.getAuthorizationUrl(state);
          break;
        default:
          throw new Error(`Provider ${provider} not supported`);
      }

      return { authUrl, state };
    } catch (error: any) {
      logger.error({ error, provider }, 'Failed to initiate OAuth');
      throw error;
    }
  }

  async handleCallback(
    state: string,
    code: string
  ): Promise<{ userId: string; provider: IntegrationProvider; integrationId: string }> {
    try {
      // Verify state
      const oauthState = await prisma.oAuthState.findUnique({
        where: { state },
      });

      if (!oauthState) {
        throw new Error('Invalid OAuth state');
      }

      if (oauthState.expiresAt < new Date()) {
        await prisma.oAuthState.delete({ where: { state } });
        throw new Error('OAuth state expired');
      }

      // Exchange code for tokens based on provider
      let tokens: any;
      let metadata: any = {};

      switch (oauthState.provider) {
        case IntegrationProvider.TIKTOK:
          tokens = await tiktokConnector.exchangeCodeForTokens(code, oauthState.redirectUri!);
          const tiktokUser = await tiktokConnector.getUserInfo(tokens.accessToken);
          metadata.userId = tiktokUser.openId;
          metadata.username = tiktokUser.displayName;
          break;

        case IntegrationProvider.INSTAGRAM:
        case IntegrationProvider.FACEBOOK:
          tokens = await metaConnector.exchangeCodeForTokens(code, oauthState.redirectUri!);
          const longLivedTokens = await metaConnector.getLongLivedToken(tokens.accessToken);
          tokens = longLivedTokens;
          const metaUser = await metaConnector.getUserInfo(tokens.accessToken);
          metadata.userId = metaUser.id;
          metadata.userName = metaUser.name;
          break;

        case IntegrationProvider.YOUTUBE:
          tokens = await youtubeConnector.exchangeCodeForTokens(code);
          const channelInfo = await youtubeConnector.getChannelInfo(tokens.accessToken);
          metadata.channelId = channelInfo.id;
          metadata.channelTitle = channelInfo.title;
          break;

        case IntegrationProvider.HUBSPOT:
          tokens = await hubspotConnector.exchangeCodeForTokens(code, oauthState.redirectUri!);
          break;

        case IntegrationProvider.SALESFORCE:
          tokens = await salesforceConnector.exchangeCodeForTokens(code, oauthState.redirectUri!);
          metadata.instanceUrl = tokens.instanceUrl;
          metadata.userId = tokens.userId;
          break;

        case IntegrationProvider.SHOPIFY:
          if (!(oauthState.metadata as any)?.shop) {
            throw new Error('Shopify shop domain is required');
          }
          tokens = await shopifyConnector.exchangeCodeForTokens((oauthState.metadata as any)?.shop, code);
          (metadata as any).shop = (oauthState.metadata as any)?.shop;
          break;

        case IntegrationProvider.GOOGLE_ADS:
          tokens = await googleAdsConnector.exchangeCodeForTokens(code);
          break;

        default:
          throw new Error(`Provider ${oauthState.provider} not supported`);
      }

      // Calculate token expiration
      const expiresAt = tokens.expiresIn
        ? new Date(Date.now() + tokens.expiresIn * 1000)
        : undefined;

      // Create or update integration
      const integration = await prisma.integration.upsert({
        where: {
          userId_provider: {
            userId: oauthState.userId,
            provider: oauthState.provider,
          },
        },
        create: {
          userId: oauthState.userId,
          provider: oauthState.provider,
          name: `${oauthState.provider} Integration`,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenType: tokens.tokenType || 'Bearer',
          expiresAt,
          scope: tokens.scope || [],
          metadata,
          isActive: true,
        },
        update: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenType: tokens.tokenType || 'Bearer',
          expiresAt,
          scope: tokens.scope || [],
          metadata,
          isActive: true,
          lastError: null,
        },
      });

      // Delete OAuth state
      await prisma.oAuthState.delete({ where: { state } });

      logger.info(
        { userId: oauthState.userId, provider: oauthState.provider },
        'Integration created successfully'
      );

      return {
        userId: oauthState.userId,
        provider: oauthState.provider,
        integrationId: integration.id,
      };
    } catch (error: any) {
      logger.error({ error, state }, 'Failed to handle OAuth callback');
      throw error;
    }
  }

  async refreshToken(integrationId: string): Promise<void> {
    try {
      const integration = await prisma.integration.findUnique({
        where: { id: integrationId },
      });

      if (!integration || !integration.refreshToken) {
        throw new Error('Integration or refresh token not found');
      }

      let tokens: any;

      switch (integration.provider) {
        case IntegrationProvider.TIKTOK:
          tokens = await tiktokConnector.refreshAccessToken(integration.refreshToken);
          break;
        case IntegrationProvider.YOUTUBE:
          tokens = await youtubeConnector.refreshAccessToken(integration.refreshToken);
          break;
        case IntegrationProvider.HUBSPOT:
          tokens = await hubspotConnector.refreshAccessToken(integration.refreshToken);
          break;
        case IntegrationProvider.SALESFORCE:
          tokens = await salesforceConnector.refreshAccessToken(
            integration.refreshToken,
            (integration.metadata as any)?.instanceUrl
          );
          break;
        case IntegrationProvider.GOOGLE_ADS:
          tokens = await googleAdsConnector.refreshAccessToken(integration.refreshToken);
          break;
        default:
          throw new Error(`Token refresh not supported for ${integration.provider}`);
      }

      const expiresAt = tokens.expiresIn
        ? new Date(Date.now() + tokens.expiresIn * 1000)
        : undefined;

      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken || integration.refreshToken,
          expiresAt,
          lastError: null,
        },
      });

      logger.info({ integrationId }, 'Token refreshed successfully');
    } catch (error: any) {
      logger.error({ error, integrationId }, 'Failed to refresh token');

      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          lastError: error.message,
        },
      });

      throw error;
    }
  }
}

export const oauthService = new OAuthService();
