import axios, { AxiosInstance } from 'axios';
import pino from 'pino';
import pRetry from 'p-retry';
import FormData from 'form-data';
import { createReadStream } from 'fs';

const logger = pino();

export interface FacebookPublishOptions {
  accessToken: string;
  pageId: string;
  videoPath?: string;
  videoUrl?: string;
  title: string;
  description?: string;
  tags?: string[];
  scheduled?: boolean;
  publishTime?: Date;
}

export interface FacebookPublishResult {
  postId: string;
  postUrl: string;
  publishTime: Date;
}

export class FacebookAdapter {
  private client: AxiosInstance;
  private logger = logger.child({ platform: 'Facebook' });

  constructor() {
    this.client = axios.create({
      baseURL: 'https://graph.facebook.com/v18.0',
      timeout: 120000,
    });
  }

  async publish(
    options: FacebookPublishOptions
  ): Promise<FacebookPublishResult> {
    this.logger.info({ pageId: options.pageId }, 'Publishing to Facebook');

    try {
      let postId: string;

      if (options.videoPath) {
        // Upload video file
        postId = await this.uploadVideo(options);
      } else if (options.videoUrl) {
        // Publish from URL
        postId = await this.publishVideoUrl(options);
      } else {
        throw new Error('Either videoPath or videoUrl must be provided');
      }

      const postUrl = `https://www.facebook.com/${postId}`;

      const result: FacebookPublishResult = {
        postId,
        postUrl,
        publishTime: options.publishTime || new Date(),
      };

      this.logger.info(
        { postId },
        'Published to Facebook successfully'
      );

      return result;
    } catch (error) {
      this.logger.error({ error }, 'Failed to publish to Facebook');
      throw error;
    }
  }

  private async uploadVideo(
    options: FacebookPublishOptions
  ): Promise<string> {
    const formData = new FormData();
    formData.append('source', createReadStream(options.videoPath!));
    formData.append('title', options.title);
    formData.append('description', options.description || '');
    formData.append('access_token', options.accessToken);

    if (options.scheduled && options.publishTime) {
      formData.append('published', 'false');
      formData.append(
        'scheduled_publish_time',
        Math.floor(options.publishTime.getTime() / 1000).toString()
      );
    }

    const response = await pRetry(
      async () => {
        return await this.client.post(
          `/${options.pageId}/videos`,
          formData,
          {
            headers: formData.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
          }
        );
      },
      {
        retries: 3,
        onFailedAttempt: (error) => {
          this.logger.warn(
            { attempt: error.attemptNumber, error: error.message },
            'Upload failed, retrying'
          );
        },
      }
    );

    return response.data.id;
  }

  private async publishVideoUrl(
    options: FacebookPublishOptions
  ): Promise<string> {
    const params: any = {
      file_url: options.videoUrl,
      title: options.title,
      description: options.description || '',
      access_token: options.accessToken,
    };

    if (options.scheduled && options.publishTime) {
      params.published = false;
      params.scheduled_publish_time = Math.floor(
        options.publishTime.getTime() / 1000
      );
    }

    const response = await pRetry(
      async () => {
        return await this.client.post(
          `/${options.pageId}/videos`,
          null,
          { params }
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

    return response.data.id;
  }

  async schedulePost(
    options: FacebookPublishOptions
  ): Promise<FacebookPublishResult> {
    return this.publish({
      ...options,
      scheduled: true,
    });
  }

  async getPublishStatus(
    accessToken: string,
    postId: string
  ): Promise<any> {
    const response = await this.client.get(`/${postId}`, {
      params: {
        fields: 'id,created_time,message,permalink_url,status',
        access_token: accessToken,
      },
    });

    return response.data;
  }
}
