import axios from 'axios';
import { config } from '../../config';
import pino from 'pino';

const logger = pino({ name: 'tiktok-connector' });

const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';
const TIKTOK_AUTH_BASE = 'https://www.tiktok.com/v2/auth';

export interface TikTokTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope: string[];
}

export interface TikTokUserInfo {
  openId: string;
  unionId: string;
  displayName: string;
  avatarUrl: string;
  followerCount?: number;
  followingCount?: number;
  videoCount?: number;
}

export interface TikTokVideo {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  videoUrl: string;
  duration: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
}

export class TikTokConnector {
  async getAuthorizationUrl(state: string, redirectUri: string): Promise<string> {
    const params = new URLSearchParams({
      client_key: config.tiktok.clientKey,
      response_type: 'code',
      scope: 'user.info.basic,video.list,video.upload',
      redirect_uri: redirectUri,
      state,
    });

    return `${TIKTOK_AUTH_BASE}/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<TikTokTokens> {
    try {
      const response = await axios.post(`${TIKTOK_AUTH_BASE}/token`, {
        client_key: config.tiktok.clientKey,
        client_secret: config.tiktok.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });

      const data = response.data.data;

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        scope: data.scope.split(','),
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to exchange code for tokens');
      throw new Error('Failed to authenticate with TikTok');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<TikTokTokens> {
    try {
      const response = await axios.post(`${TIKTOK_AUTH_BASE}/token`, {
        client_key: config.tiktok.clientKey,
        client_secret: config.tiktok.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });

      const data = response.data.data;

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        scope: data.scope.split(','),
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to refresh access token');
      throw new Error('Failed to refresh TikTok access token');
    }
  }

  async getUserInfo(accessToken: string): Promise<TikTokUserInfo> {
    try {
      const response = await axios.get(`${TIKTOK_API_BASE}/user/info`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          fields: 'open_id,union_id,display_name,avatar_url,follower_count,following_count,video_count',
        },
      });

      const user = response.data.data.user;

      return {
        openId: user.open_id,
        unionId: user.union_id,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        followerCount: user.follower_count,
        followingCount: user.following_count,
        videoCount: user.video_count,
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to get user info');
      throw new Error('Failed to get TikTok user info');
    }
  }

  async getVideos(accessToken: string, cursor?: string, maxCount: number = 20): Promise<{ videos: TikTokVideo[]; cursor?: string; hasMore: boolean }> {
    try {
      const response = await axios.post(
        `${TIKTOK_API_BASE}/video/list`,
        {
          max_count: maxCount,
          cursor: cursor || 0,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data.data;

      const videos: TikTokVideo[] = (data.videos || []).map((video: any) => ({
        id: video.id,
        title: video.title,
        description: video.video_description,
        coverImageUrl: video.cover_image_url,
        videoUrl: video.share_url,
        duration: video.duration,
        viewCount: video.view_count || 0,
        likeCount: video.like_count || 0,
        commentCount: video.comment_count || 0,
        shareCount: video.share_count || 0,
        createdAt: new Date(video.create_time * 1000).toISOString(),
      }));

      return {
        videos,
        cursor: data.cursor,
        hasMore: data.has_more,
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to get videos');
      throw new Error('Failed to get TikTok videos');
    }
  }

  async uploadVideo(accessToken: string, videoUrl: string, title: string, description?: string): Promise<{ videoId: string }> {
    try {
      // TikTok requires a multi-step upload process
      // 1. Initialize upload
      const initResponse = await axios.post(
        `${TIKTOK_API_BASE}/post/publish/video/init`,
        {
          post_info: {
            title,
            description: description || '',
            privacy_level: 'SELF_ONLY',
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
            video_cover_timestamp_ms: 1000,
          },
          source_info: {
            source: 'FILE_UPLOAD',
            video_url: videoUrl,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const publishId = initResponse.data.data.publish_id;

      logger.info({ publishId }, 'Video upload initiated');

      return {
        videoId: publishId,
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to upload video');
      throw new Error('Failed to upload video to TikTok');
    }
  }

  async getVideoAnalytics(accessToken: string, videoIds: string[]): Promise<any> {
    try {
      const response = await axios.post(
        `${TIKTOK_API_BASE}/research/video/query`,
        {
          filters: {
            video_id: {
              operation: 'IN',
              field_values: videoIds,
            },
          },
          max_count: 100,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.data.videos;
    } catch (error: any) {
      logger.error({ error }, 'Failed to get video analytics');
      throw new Error('Failed to get TikTok video analytics');
    }
  }
}

export const tiktokConnector = new TikTokConnector();
