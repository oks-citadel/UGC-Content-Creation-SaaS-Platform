import { google, youtube_v3 } from 'googleapis';
import pino from 'pino';

const logger = pino();

export interface YouTubeMetrics {
  videoId: string;
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  watchTime: number;
  avgViewDuration: number;
  subscribersGained: number;
  timestamp: Date;
}

export class YouTubeCollector {
  private youtube: youtube_v3.Youtube;
  private youtubeAnalytics: any;
  private logger = logger.child({ platform: 'YouTube' });

  constructor() {
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    this.youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    this.youtubeAnalytics = google.youtubeAnalytics({
      version: 'v2',
      auth: oauth2Client,
    });
  }

  async collectMetrics(
    accessToken: string,
    videoId: string
  ): Promise<YouTubeMetrics> {
    this.logger.info({ videoId }, 'Collecting YouTube metrics');

    try {
      // Set credentials
      const oauth2Client = this.youtube.context._options.auth as any;
      oauth2Client.setCredentials({
        access_token: accessToken,
      });

      // Get video statistics
      const videoResponse = await this.youtube.videos.list({
        part: ['statistics'],
        id: [videoId],
      });

      const stats = videoResponse.data.items?.[0]?.statistics;

      if (!stats) {
        throw new Error('Video not found');
      }

      // Get analytics data
      const today = new Date();
      const endDate = today.toISOString().split('T')[0];
      const startDate = new Date(today.setDate(today.getDate() - 30))
        .toISOString()
        .split('T')[0];

      const analyticsResponse = await this.youtubeAnalytics.reports.query({
        ids: 'channel==MINE',
        startDate,
        endDate,
        metrics: 'estimatedMinutesWatched,averageViewDuration,subscribersGained',
        filters: `video==${videoId}`,
      });

      const analyticsData = analyticsResponse.data.rows?.[0] || [0, 0, 0];

      return {
        videoId,
        views: parseInt(stats.viewCount || '0'),
        likes: parseInt(stats.likeCount || '0'),
        dislikes: 0, // No longer available via API
        comments: parseInt(stats.commentCount || '0'),
        shares: 0, // Not directly available
        watchTime: analyticsData[0] * 60, // Convert minutes to seconds
        avgViewDuration: analyticsData[1],
        subscribersGained: analyticsData[2],
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error({ error, videoId }, 'Failed to collect YouTube metrics');
      throw error;
    }
  }

  async collectChannelMetrics(
    accessToken: string
  ): Promise<{
    subscribers: number;
    views: number;
    videos: number;
  }> {
    const oauth2Client = this.youtube.context._options.auth as any;
    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    const response = await this.youtube.channels.list({
      part: ['statistics'],
      mine: true,
    });

    const stats = response.data.items?.[0]?.statistics;

    if (!stats) {
      throw new Error('Channel not found');
    }

    return {
      subscribers: parseInt(stats.subscriberCount || '0'),
      views: parseInt(stats.viewCount || '0'),
      videos: parseInt(stats.videoCount || '0'),
    };
  }
}
