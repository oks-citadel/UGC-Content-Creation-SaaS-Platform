import axios, { AxiosInstance } from 'axios';
import pino from 'pino';

const logger = pino();

export interface InstagramMetrics {
  mediaId: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  videoViews: number;
  engagement: number;
  timestamp: Date;
}

export class InstagramCollector {
  private client: AxiosInstance;
  private logger = logger.child({ platform: 'Instagram' });

  constructor() {
    this.client = axios.create({
      baseURL: 'https://graph.facebook.com/v18.0',
      timeout: 30000,
    });
  }

  async collectMetrics(
    accessToken: string,
    mediaId: string
  ): Promise<InstagramMetrics> {
    this.logger.info({ mediaId }, 'Collecting Instagram metrics');

    try {
      // Get media insights
      const insightsResponse = await this.client.get(`/${mediaId}/insights`, {
        params: {
          metric:
            'impressions,reach,likes,comments,shares,saved,video_views,engagement',
          access_token: accessToken,
        },
      });

      const insights = insightsResponse.data.data.reduce(
        (acc: any, metric: any) => {
          acc[metric.name] = metric.values[0].value;
          return acc;
        },
        {}
      );

      return {
        mediaId,
        impressions: insights.impressions || 0,
        reach: insights.reach || 0,
        likes: insights.likes || 0,
        comments: insights.comments || 0,
        shares: insights.shares || 0,
        saves: insights.saved || 0,
        videoViews: insights.video_views || 0,
        engagement: insights.engagement || 0,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        { error, mediaId },
        'Failed to collect Instagram metrics'
      );
      throw error;
    }
  }

  async collectAccountMetrics(
    accessToken: string,
    userId: string
  ): Promise<{
    followers: number;
    following: number;
    mediaCount: number;
  }> {
    const response = await this.client.get(`/${userId}`, {
      params: {
        fields: 'followers_count,follows_count,media_count',
        access_token: accessToken,
      },
    });

    return {
      followers: response.data.followers_count || 0,
      following: response.data.follows_count || 0,
      mediaCount: response.data.media_count || 0,
    };
  }
}
