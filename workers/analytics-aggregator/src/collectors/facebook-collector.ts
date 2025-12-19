import axios, { AxiosInstance } from 'axios';
import pino from 'pino';

const logger = pino();

export interface FacebookMetrics {
  postId: string;
  impressions: number;
  reach: number;
  reactions: number;
  comments: number;
  shares: number;
  clicks: number;
  videoViews: number;
  videoViewTime: number;
  timestamp: Date;
}

export class FacebookCollector {
  private client: AxiosInstance;
  private logger = logger.child({ platform: 'Facebook' });

  constructor() {
    this.client = axios.create({
      baseURL: 'https://graph.facebook.com/v18.0',
      timeout: 30000,
    });
  }

  async collectMetrics(
    accessToken: string,
    postId: string
  ): Promise<FacebookMetrics> {
    this.logger.info({ postId }, 'Collecting Facebook metrics');

    try {
      // Get post insights
      const insightsResponse = await this.client.get(`/${postId}/insights`, {
        params: {
          metric:
            'post_impressions,post_impressions_unique,post_reactions_by_type_total,post_clicks,post_video_views,post_video_view_time',
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

      // Get post engagement (comments, shares)
      const postResponse = await this.client.get(`/${postId}`, {
        params: {
          fields: 'shares,comments.summary(true)',
          access_token: accessToken,
        },
      });

      const reactions = Object.values(
        insights.post_reactions_by_type_total || {}
      ).reduce((sum: number, count: any) => sum + count, 0);

      return {
        postId,
        impressions: insights.post_impressions || 0,
        reach: insights.post_impressions_unique || 0,
        reactions,
        comments: postResponse.data.comments?.summary?.total_count || 0,
        shares: postResponse.data.shares?.count || 0,
        clicks: insights.post_clicks || 0,
        videoViews: insights.post_video_views || 0,
        videoViewTime: insights.post_video_view_time || 0,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error({ error, postId }, 'Failed to collect Facebook metrics');
      throw error;
    }
  }

  async collectPageMetrics(
    accessToken: string,
    pageId: string
  ): Promise<{
    followers: number;
    likes: number;
    impressions: number;
  }> {
    const response = await this.client.get(`/${pageId}`, {
      params: {
        fields: 'followers_count,fan_count',
        access_token: accessToken,
      },
    });

    // Get page impressions
    const insightsResponse = await this.client.get(`/${pageId}/insights`, {
      params: {
        metric: 'page_impressions',
        period: 'day',
        access_token: accessToken,
      },
    });

    return {
      followers: response.data.followers_count || 0,
      likes: response.data.fan_count || 0,
      impressions: insightsResponse.data.data[0]?.values[0]?.value || 0,
    };
  }
}
