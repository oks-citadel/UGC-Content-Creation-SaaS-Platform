import pino from 'pino';
import PQueue from 'p-queue';
import { TikTokAdapter } from './platforms/tiktok';
import { InstagramAdapter } from './platforms/instagram';
import { YouTubeAdapter } from './platforms/youtube';
import { FacebookAdapter } from './platforms/facebook';

const logger = pino();

export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'facebook';

export interface PublishOptions {
  platform: Platform;
  credentials: {
    accessToken: string;
    refreshToken?: string;
    userId?: string;
    pageId?: string;
  };
  content: {
    videoPath?: string;
    videoUrl?: string;
    title: string;
    description?: string;
    tags?: string[];
    thumbnailPath?: string;
  };
  settings?: {
    privacy?: string;
    scheduled?: boolean;
    publishTime?: Date;
    allowComments?: boolean;
    allowDuet?: boolean;
    allowStitch?: boolean;
  };
}

export interface PublishResult {
  platform: Platform;
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
  publishTime: Date;
}

export class SocialPublisher {
  private tiktok: TikTokAdapter;
  private instagram: InstagramAdapter;
  private youtube: YouTubeAdapter;
  private facebook: FacebookAdapter;
  private queues: Map<Platform, PQueue>;
  private logger = logger.child({ component: 'SocialPublisher' });

  constructor() {
    this.tiktok = new TikTokAdapter();
    this.instagram = new InstagramAdapter();
    this.youtube = new YouTubeAdapter();
    this.facebook = new FacebookAdapter();

    // Rate limit queues per platform
    this.queues = new Map([
      ['tiktok', new PQueue({ concurrency: 1, interval: 1000, intervalCap: 1 })],
      ['instagram', new PQueue({ concurrency: 1, interval: 1000, intervalCap: 1 })],
      ['youtube', new PQueue({ concurrency: 1, interval: 1000, intervalCap: 1 })],
      ['facebook', new PQueue({ concurrency: 1, interval: 1000, intervalCap: 1 })],
    ]);
  }

  async publishToTikTok(options: PublishOptions): Promise<PublishResult> {
    this.logger.info('Publishing to TikTok');

    const queue = this.queues.get('tiktok')!;

    return queue.add(async () => {
      try {
        const result = await this.tiktok.publish({
          accessToken: options.credentials.accessToken,
          videoPath: options.content.videoPath!,
          title: options.content.title,
          description: options.content.description,
          privacy: (options.settings?.privacy as any) || 'PUBLIC',
          allowComments: options.settings?.allowComments ?? true,
          allowDuet: options.settings?.allowDuet ?? true,
          allowStitch: options.settings?.allowStitch ?? true,
        });

        return {
          platform: 'tiktok' as Platform,
          success: true,
          postId: result.videoId,
          postUrl: result.shareUrl,
          publishTime: result.publishTime,
        };
      } catch (error: any) {
        this.logger.error({ error }, 'TikTok publishing failed');
        return {
          platform: 'tiktok' as Platform,
          success: false,
          error: error.message,
          publishTime: new Date(),
        };
      }
    });
  }

  async publishToInstagram(options: PublishOptions): Promise<PublishResult> {
    this.logger.info('Publishing to Instagram');

    const queue = this.queues.get('instagram')!;

    return queue.add(async () => {
      try {
        const result = await this.instagram.publish({
          accessToken: options.credentials.accessToken,
          userId: options.credentials.userId!,
          videoUrl: options.content.videoUrl!,
          caption: options.content.description,
          coverUrl: options.content.thumbnailPath,
          shareToFeed: true,
        });

        return {
          platform: 'instagram' as Platform,
          success: true,
          postId: result.mediaId,
          postUrl: result.permalink,
          publishTime: result.publishTime,
        };
      } catch (error: any) {
        this.logger.error({ error }, 'Instagram publishing failed');
        return {
          platform: 'instagram' as Platform,
          success: false,
          error: error.message,
          publishTime: new Date(),
        };
      }
    });
  }

  async publishToYouTube(options: PublishOptions): Promise<PublishResult> {
    this.logger.info('Publishing to YouTube');

    const queue = this.queues.get('youtube')!;

    return queue.add(async () => {
      try {
        const result = await this.youtube.publish({
          accessToken: options.credentials.accessToken,
          refreshToken: options.credentials.refreshToken!,
          videoPath: options.content.videoPath!,
          title: options.content.title,
          description: options.content.description,
          tags: options.content.tags,
          privacy: (options.settings?.privacy as any) || 'public',
          thumbnailPath: options.content.thumbnailPath,
        });

        return {
          platform: 'youtube' as Platform,
          success: true,
          postId: result.videoId,
          postUrl: result.videoUrl,
          publishTime: result.publishTime,
        };
      } catch (error: any) {
        this.logger.error({ error }, 'YouTube publishing failed');
        return {
          platform: 'youtube' as Platform,
          success: false,
          error: error.message,
          publishTime: new Date(),
        };
      }
    });
  }

  async publishToFacebook(options: PublishOptions): Promise<PublishResult> {
    this.logger.info('Publishing to Facebook');

    const queue = this.queues.get('facebook')!;

    return queue.add(async () => {
      try {
        const result = await this.facebook.publish({
          accessToken: options.credentials.accessToken,
          pageId: options.credentials.pageId!,
          videoPath: options.content.videoPath,
          videoUrl: options.content.videoUrl,
          title: options.content.title,
          description: options.content.description,
          tags: options.content.tags,
          scheduled: options.settings?.scheduled,
          publishTime: options.settings?.publishTime,
        });

        return {
          platform: 'facebook' as Platform,
          success: true,
          postId: result.postId,
          postUrl: result.postUrl,
          publishTime: result.publishTime,
        };
      } catch (error: any) {
        this.logger.error({ error }, 'Facebook publishing failed');
        return {
          platform: 'facebook' as Platform,
          success: false,
          error: error.message,
          publishTime: new Date(),
        };
      }
    });
  }

  async schedulePost(options: PublishOptions): Promise<PublishResult> {
    this.logger.info(
      { platform: options.platform, publishTime: options.settings?.publishTime },
      'Scheduling post'
    );

    const scheduledOptions = {
      ...options,
      settings: {
        ...options.settings,
        scheduled: true,
      },
    };

    switch (options.platform) {
      case 'facebook':
        return this.publishToFacebook(scheduledOptions);
      default:
        throw new Error(`Scheduling not supported for ${options.platform}`);
    }
  }

  async getPublishStatus(
    platform: Platform,
    postId: string,
    accessToken: string
  ): Promise<any> {
    this.logger.info({ platform, postId }, 'Getting publish status');

    switch (platform) {
      case 'tiktok':
        return this.tiktok.getPublishStatus(accessToken, postId);
      case 'instagram':
        return this.instagram.getPublishStatus(accessToken, postId);
      case 'youtube':
        return this.youtube.getPublishStatus(postId);
      case 'facebook':
        return this.facebook.getPublishStatus(accessToken, postId);
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
  }
}
