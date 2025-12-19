import axios from 'axios';
import { config } from '../../config';
import pino from 'pino';

const logger = pino({ name: 'meta-connector' });

const META_GRAPH_API = 'https://graph.facebook.com/v18.0';
const META_OAUTH_BASE = 'https://www.facebook.com/v18.0/dialog/oauth';

export interface MetaTokens {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface MetaUserInfo {
  id: string;
  name: string;
  email?: string;
  picture?: string;
}

export interface MetaPage {
  id: string;
  name: string;
  category: string;
  accessToken: string;
  followerCount?: number;
}

export interface MetaPost {
  id: string;
  message?: string;
  story?: string;
  createdTime: string;
  permalink: string;
  likes?: number;
  comments?: number;
  shares?: number;
}

export interface InstagramAccount {
  id: string;
  username: string;
  name: string;
  profilePictureUrl?: string;
  followerCount?: number;
  mediaCount?: number;
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  mediaUrl: string;
  permalink: string;
  timestamp: string;
  likeCount?: number;
  commentsCount?: number;
}

export class MetaConnector {
  async getAuthorizationUrl(state: string, redirectUri: string, scopes: string[]): Promise<string> {
    const params = new URLSearchParams({
      client_id: config.meta.appId,
      redirect_uri: redirectUri,
      state,
      scope: scopes.join(','),
      response_type: 'code',
    });

    return `${META_OAUTH_BASE}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<MetaTokens> {
    try {
      const response = await axios.get(`${META_GRAPH_API}/oauth/access_token`, {
        params: {
          client_id: config.meta.appId,
          client_secret: config.meta.appSecret,
          redirect_uri: redirectUri,
          code,
        },
      });

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type || 'Bearer',
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to exchange code for tokens');
      throw new Error('Failed to authenticate with Meta');
    }
  }

  async getLongLivedToken(shortLivedToken: string): Promise<MetaTokens> {
    try {
      const response = await axios.get(`${META_GRAPH_API}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: config.meta.appId,
          client_secret: config.meta.appSecret,
          fb_exchange_token: shortLivedToken,
        },
      });

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
        tokenType: 'Bearer',
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to get long-lived token');
      throw new Error('Failed to get long-lived Meta token');
    }
  }

  async getUserInfo(accessToken: string): Promise<MetaUserInfo> {
    try {
      const response = await axios.get(`${META_GRAPH_API}/me`, {
        params: {
          fields: 'id,name,email,picture',
          access_token: accessToken,
        },
      });

      return {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        picture: response.data.picture?.data?.url,
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to get user info');
      throw new Error('Failed to get Meta user info');
    }
  }

  async getPages(accessToken: string): Promise<MetaPage[]> {
    try {
      const response = await axios.get(`${META_GRAPH_API}/me/accounts`, {
        params: {
          fields: 'id,name,category,access_token,followers_count',
          access_token: accessToken,
        },
      });

      return response.data.data.map((page: any) => ({
        id: page.id,
        name: page.name,
        category: page.category,
        accessToken: page.access_token,
        followerCount: page.followers_count,
      }));
    } catch (error: any) {
      logger.error({ error }, 'Failed to get pages');
      throw new Error('Failed to get Facebook pages');
    }
  }

  async publishPost(pageAccessToken: string, pageId: string, message: string, link?: string, imageUrl?: string): Promise<{ id: string }> {
    try {
      const params: any = {
        message,
        access_token: pageAccessToken,
      };

      if (link) {
        params.link = link;
      }

      if (imageUrl) {
        params.url = imageUrl;
      }

      const response = await axios.post(`${META_GRAPH_API}/${pageId}/feed`, null, { params });

      return {
        id: response.data.id,
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to publish post');
      throw new Error('Failed to publish Facebook post');
    }
  }

  async getInstagramAccount(pageAccessToken: string, pageId: string): Promise<InstagramAccount | null> {
    try {
      const response = await axios.get(`${META_GRAPH_API}/${pageId}`, {
        params: {
          fields: 'instagram_business_account',
          access_token: pageAccessToken,
        },
      });

      if (!response.data.instagram_business_account) {
        return null;
      }

      const igAccountId = response.data.instagram_business_account.id;

      const accountResponse = await axios.get(`${META_GRAPH_API}/${igAccountId}`, {
        params: {
          fields: 'id,username,name,profile_picture_url,followers_count,media_count',
          access_token: pageAccessToken,
        },
      });

      return {
        id: accountResponse.data.id,
        username: accountResponse.data.username,
        name: accountResponse.data.name,
        profilePictureUrl: accountResponse.data.profile_picture_url,
        followerCount: accountResponse.data.followers_count,
        mediaCount: accountResponse.data.media_count,
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to get Instagram account');
      throw new Error('Failed to get Instagram account');
    }
  }

  async publishInstagramPost(
    pageAccessToken: string,
    igAccountId: string,
    imageUrl: string,
    caption?: string
  ): Promise<{ id: string }> {
    try {
      // Create media container
      const containerResponse = await axios.post(
        `${META_GRAPH_API}/${igAccountId}/media`,
        null,
        {
          params: {
            image_url: imageUrl,
            caption: caption || '',
            access_token: pageAccessToken,
          },
        }
      );

      const creationId = containerResponse.data.id;

      // Publish media
      const publishResponse = await axios.post(
        `${META_GRAPH_API}/${igAccountId}/media_publish`,
        null,
        {
          params: {
            creation_id: creationId,
            access_token: pageAccessToken,
          },
        }
      );

      return {
        id: publishResponse.data.id,
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to publish Instagram post');
      throw new Error('Failed to publish Instagram post');
    }
  }

  async getInstagramMedia(
    pageAccessToken: string,
    igAccountId: string,
    limit: number = 25
  ): Promise<InstagramMedia[]> {
    try {
      const response = await axios.get(`${META_GRAPH_API}/${igAccountId}/media`, {
        params: {
          fields: 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
          limit,
          access_token: pageAccessToken,
        },
      });

      return response.data.data.map((media: any) => ({
        id: media.id,
        caption: media.caption,
        mediaType: media.media_type,
        mediaUrl: media.media_url,
        permalink: media.permalink,
        timestamp: media.timestamp,
        likeCount: media.like_count,
        commentsCount: media.comments_count,
      }));
    } catch (error: any) {
      logger.error({ error }, 'Failed to get Instagram media');
      throw new Error('Failed to get Instagram media');
    }
  }

  async getPostInsights(pageAccessToken: string, postId: string): Promise<any> {
    try {
      const response = await axios.get(`${META_GRAPH_API}/${postId}/insights`, {
        params: {
          metric: 'post_impressions,post_engaged_users,post_clicks',
          access_token: pageAccessToken,
        },
      });

      return response.data.data;
    } catch (error: any) {
      logger.error({ error }, 'Failed to get post insights');
      throw new Error('Failed to get post insights');
    }
  }
}

export const metaConnector = new MetaConnector();
