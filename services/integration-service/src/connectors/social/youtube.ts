import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../../config';
import pino from 'pino';

const logger = pino({ name: 'youtube-connector' });

const oauth2Client = new OAuth2Client(
  config.youtube.clientId,
  config.youtube.clientSecret,
  config.oauth.callbackBaseUrl + '/youtube'
);

export class YouTubeConnector {
  async getAuthorizationUrl(state: string): Promise<string> {
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.force-ssl',
        'https://www.googleapis.com/auth/youtubepartner',
      ],
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
      throw new Error('Failed to authenticate with YouTube');
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
      throw new Error('Failed to refresh YouTube access token');
    }
  }

  async getChannelInfo(accessToken: string) {
    try {
      oauth2Client.setCredentials({ access_token: accessToken });
      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

      const response = await youtube.channels.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        mine: true,
      });

      const channel = response.data.items?.[0];
      if (!channel) {
        throw new Error('No channel found');
      }

      return {
        id: channel.id!,
        title: channel.snippet?.title,
        description: channel.snippet?.description,
        thumbnailUrl: channel.snippet?.thumbnails?.default?.url,
        subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
        videoCount: parseInt(channel.statistics?.videoCount || '0'),
        viewCount: parseInt(channel.statistics?.viewCount || '0'),
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to get channel info');
      throw new Error('Failed to get YouTube channel info');
    }
  }

  async uploadVideo(accessToken: string, videoPath: string, title: string, description: string) {
    try {
      oauth2Client.setCredentials({ access_token: accessToken });
      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

      const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title,
            description,
            categoryId: '22', // People & Blogs
          },
          status: {
            privacyStatus: 'private',
          },
        },
        media: {
          body: require('fs').createReadStream(videoPath),
        },
      });

      return {
        videoId: response.data.id!,
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to upload video');
      throw new Error('Failed to upload video to YouTube');
    }
  }

  async getVideos(accessToken: string, maxResults: number = 25) {
    try {
      oauth2Client.setCredentials({ access_token: accessToken });
      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

      const response = await youtube.search.list({
        part: ['snippet'],
        forMine: true,
        type: ['video'],
        maxResults,
      });

      return (response.data.items || []).map(item => ({
        id: item.id?.videoId!,
        title: item.snippet?.title,
        description: item.snippet?.description,
        thumbnailUrl: item.snippet?.thumbnails?.default?.url,
        publishedAt: item.snippet?.publishedAt,
      }));
    } catch (error: any) {
      logger.error({ error }, 'Failed to get videos');
      throw new Error('Failed to get YouTube videos');
    }
  }

  async getVideoAnalytics(accessToken: string, videoId: string) {
    try {
      oauth2Client.setCredentials({ access_token: accessToken });
      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

      const response = await youtube.videos.list({
        part: ['statistics', 'contentDetails'],
        id: [videoId],
      });

      const video = response.data.items?.[0];
      if (!video) {
        throw new Error('Video not found');
      }

      return {
        viewCount: parseInt(video.statistics?.viewCount || '0'),
        likeCount: parseInt(video.statistics?.likeCount || '0'),
        commentCount: parseInt(video.statistics?.commentCount || '0'),
        duration: video.contentDetails?.duration,
      };
    } catch (error: any) {
      logger.error({ error }, 'Failed to get video analytics');
      throw new Error('Failed to get YouTube video analytics');
    }
  }
}

export const youtubeConnector = new YouTubeConnector();
