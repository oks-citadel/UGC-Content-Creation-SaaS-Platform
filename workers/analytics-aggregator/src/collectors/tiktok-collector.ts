import axios, { AxiosInstance } from 'axios';
import pino from 'pino';

const logger = pino();

export interface TikTokMetrics {
  videoId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  playTime: number;
  avgWatchTime: number;
  completionRate: number;
  timestamp: Date;
}

export class TikTokCollector {
  private client: AxiosInstance;
  private logger = logger.child({ platform: 'TikTok' });

  constructor() {
    this.client = axios.create({
      baseURL: 'https://open.tiktokapis.com/v2',
      timeout: 30000,
    });
  }

  async collectMetrics(
    accessToken: string,
    videoId: string
  ): Promise<TikTokMetrics> {
    this.logger.info({ videoId }, 'Collecting TikTok metrics');

    try {
      const response = await this.client.get('/video/query/', {
        params: {
          fields:
            'id,view_count,like_count,comment_count,share_count,play_duration,avg_time_watched,completion_rate',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = response.data.data;

      return {
        videoId,
        views: data.view_count || 0,
        likes: data.like_count || 0,
        comments: data.comment_count || 0,
        shares: data.share_count || 0,
        playTime: data.play_duration || 0,
        avgWatchTime: data.avg_time_watched || 0,
        completionRate: data.completion_rate || 0,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error({ error, videoId }, 'Failed to collect TikTok metrics');
      throw error;
    }
  }

  async collectUserMetrics(
    accessToken: string
  ): Promise<{
    followers: number;
    following: number;
    totalViews: number;
    totalLikes: number;
  }> {
    const response = await this.client.get('/user/info/', {
      params: {
        fields: 'follower_count,following_count,video_count,likes_count',
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = response.data.data.user;

    return {
      followers: data.follower_count || 0,
      following: data.following_count || 0,
      totalViews: data.video_count || 0,
      totalLikes: data.likes_count || 0,
    };
  }
}
