import axios, { AxiosInstance } from 'axios';
import pino from 'pino';
import pRetry from 'p-retry';

const logger = pino();

export interface InstagramPublishOptions {
  accessToken: string;
  userId: string;
  videoUrl: string;
  caption?: string;
  locationId?: string;
  coverUrl?: string;
  shareToFeed?: boolean;
}

export interface InstagramPublishResult {
  mediaId: string;
  permalink: string;
  publishTime: Date;
}

export class InstagramAdapter {
  private client: AxiosInstance;
  private logger = logger.child({ platform: 'Instagram' });

  constructor() {
    this.client = axios.create({
      baseURL: 'https://graph.facebook.com/v18.0',
      timeout: 60000,
    });
  }

  async publish(
    options: InstagramPublishOptions
  ): Promise<InstagramPublishResult> {
    this.logger.info({ userId: options.userId }, 'Publishing to Instagram');

    try {
      // Step 1: Create media container
      const containerId = await this.createMediaContainer(options);

      // Step 2: Publish container
      const publishResult = await this.publishContainer(
        options.accessToken,
        options.userId,
        containerId
      );

      this.logger.info(
        { mediaId: publishResult.mediaId },
        'Published to Instagram successfully'
      );

      return publishResult;
    } catch (error) {
      this.logger.error({ error }, 'Failed to publish to Instagram');
      throw error;
    }
  }

  private async createMediaContainer(
    options: InstagramPublishOptions
  ): Promise<string> {
    const params: any = {
      media_type: 'REELS',
      video_url: options.videoUrl,
      caption: options.caption || '',
      share_to_feed: options.shareToFeed !== false,
      access_token: options.accessToken,
    };

    if (options.coverUrl) {
      params.cover_url = options.coverUrl;
    }

    if (options.locationId) {
      params.location_id = options.locationId;
    }

    const response = await pRetry(
      async () => {
        return await this.client.post(
          `/${options.userId}/media`,
          null,
          { params }
        );
      },
      {
        retries: 3,
        onFailedAttempt: (error) => {
          this.logger.warn(
            { attempt: error.attemptNumber, error: error.message },
            'Container creation failed, retrying'
          );
        },
      }
    );

    return response.data.id;
  }

  private async publishContainer(
    accessToken: string,
    userId: string,
    containerId: string
  ): Promise<InstagramPublishResult> {
    // Wait for video to be processed
    await this.waitForProcessing(accessToken, containerId);

    const response = await pRetry(
      async () => {
        return await this.client.post(
          `/${userId}/media_publish`,
          null,
          {
            params: {
              creation_id: containerId,
              access_token: accessToken,
            },
          }
        );
      },
      {
        retries: 3,
        onFailedAttempt: (error) => {
          this.logger.warn(
            { attempt: error.attemptNumber, error: error.message },
            'Publishing failed, retrying'
          );
        },
      }
    );

    const mediaId = response.data.id;

    // Get permalink
    const mediaInfo = await this.client.get(`/${mediaId}`, {
      params: {
        fields: 'permalink',
        access_token: accessToken,
      },
    });

    return {
      mediaId,
      permalink: mediaInfo.data.permalink,
      publishTime: new Date(),
    };
  }

  private async waitForProcessing(
    accessToken: string,
    containerId: string,
    maxAttempts = 30
  ): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await this.client.get(`/${containerId}`, {
        params: {
          fields: 'status_code',
          access_token: accessToken,
        },
      });

      const status = response.data.status_code;

      if (status === 'FINISHED') {
        return;
      } else if (status === 'ERROR') {
        throw new Error('Video processing failed');
      }

      // Wait 2 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error('Video processing timeout');
  }

  async getPublishStatus(
    accessToken: string,
    mediaId: string
  ): Promise<any> {
    const response = await this.client.get(`/${mediaId}`, {
      params: {
        fields: 'id,media_type,permalink,timestamp',
        access_token: accessToken,
      },
    });

    return response.data;
  }
}
