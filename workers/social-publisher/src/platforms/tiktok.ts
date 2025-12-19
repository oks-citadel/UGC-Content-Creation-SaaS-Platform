import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import pino from 'pino';
import { createReadStream } from 'fs';
import pRetry from 'p-retry';

const logger = pino();

export interface TikTokPublishOptions {
  accessToken: string;
  videoPath: string;
  title: string;
  description?: string;
  privacy: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
  allowComments?: boolean;
  allowDuet?: boolean;
  allowStitch?: boolean;
}

export interface TikTokPublishResult {
  videoId: string;
  shareUrl: string;
  publishTime: Date;
}

export class TikTokAdapter {
  private client: AxiosInstance;
  private logger = logger.child({ platform: 'TikTok' });

  constructor() {
    this.client = axios.create({
      baseURL: 'https://open.tiktokapis.com/v2',
      timeout: 60000,
    });
  }

  async publish(options: TikTokPublishOptions): Promise<TikTokPublishResult> {
    this.logger.info({ title: options.title }, 'Publishing to TikTok');

    try {
      // Step 1: Initialize upload
      const initResult = await this.initializeUpload(options);

      // Step 2: Upload video
      await this.uploadVideo(initResult.uploadUrl, options.videoPath);

      // Step 3: Publish video
      const publishResult = await this.publishVideo(
        options.accessToken,
        initResult.publishId,
        options
      );

      this.logger.info(
        { videoId: publishResult.videoId },
        'Published to TikTok successfully'
      );

      return publishResult;
    } catch (error) {
      this.logger.error({ error }, 'Failed to publish to TikTok');
      throw error;
    }
  }

  private async initializeUpload(options: TikTokPublishOptions) {
    const response = await pRetry(
      async () => {
        return await this.client.post(
          '/post/publish/video/init/',
          {
            post_info: {
              title: options.title,
              description: options.description || '',
              privacy_level: options.privacy,
              disable_comment: !options.allowComments,
              disable_duet: !options.allowDuet,
              disable_stitch: !options.allowStitch,
            },
            source_info: {
              source: 'FILE_UPLOAD',
            },
          },
          {
            headers: {
              Authorization: `Bearer ${options.accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
      },
      {
        retries: 3,
        onFailedAttempt: (error) => {
          this.logger.warn(
            { attempt: error.attemptNumber, error: error.message },
            'Upload initialization failed, retrying'
          );
        },
      }
    );

    return {
      uploadUrl: response.data.data.upload_url,
      publishId: response.data.data.publish_id,
    };
  }

  private async uploadVideo(uploadUrl: string, videoPath: string) {
    const formData = new FormData();
    formData.append('video', createReadStream(videoPath));

    await pRetry(
      async () => {
        await axios.put(uploadUrl, formData, {
          headers: formData.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });
      },
      {
        retries: 3,
        onFailedAttempt: (error) => {
          this.logger.warn(
            { attempt: error.attemptNumber, error: error.message },
            'Video upload failed, retrying'
          );
        },
      }
    );
  }

  private async publishVideo(
    accessToken: string,
    publishId: string,
    options: TikTokPublishOptions
  ): Promise<TikTokPublishResult> {
    const response = await pRetry(
      async () => {
        return await this.client.post(
          '/post/publish/status/fetch/',
          { publish_id: publishId },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
      },
      {
        retries: 5,
        minTimeout: 2000,
        onFailedAttempt: (error) => {
          this.logger.warn(
            { attempt: error.attemptNumber, error: error.message },
            'Status check failed, retrying'
          );
        },
      }
    );

    const data = response.data.data;

    return {
      videoId: data.video_id,
      shareUrl: data.share_url,
      publishTime: new Date(),
    };
  }

  async getPublishStatus(
    accessToken: string,
    publishId: string
  ): Promise<string> {
    const response = await this.client.post(
      '/post/publish/status/fetch/',
      { publish_id: publishId },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data.status;
  }
}
