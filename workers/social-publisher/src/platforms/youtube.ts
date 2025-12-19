import { google, youtube_v3 } from 'googleapis';
import pino from 'pino';
import { createReadStream } from 'fs';
import pRetry from 'p-retry';

const logger = pino();

export interface YouTubePublishOptions {
  accessToken: string;
  refreshToken: string;
  videoPath: string;
  title: string;
  description?: string;
  tags?: string[];
  categoryId?: string;
  privacy: 'public' | 'private' | 'unlisted';
  thumbnailPath?: string;
}

export interface YouTubePublishResult {
  videoId: string;
  videoUrl: string;
  publishTime: Date;
}

export class YouTubeAdapter {
  private youtube: youtube_v3.Youtube;
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
  }

  async publish(options: YouTubePublishOptions): Promise<YouTubePublishResult> {
    this.logger.info({ title: options.title }, 'Publishing to YouTube');

    try {
      // Set credentials
      const oauth2Client = this.youtube.context._options.auth as any;
      oauth2Client.setCredentials({
        access_token: options.accessToken,
        refresh_token: options.refreshToken,
      });

      // Upload video
      const videoId = await this.uploadVideo(options);

      // Set thumbnail if provided
      if (options.thumbnailPath) {
        await this.setThumbnail(videoId, options.thumbnailPath);
      }

      const result: YouTubePublishResult = {
        videoId,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        publishTime: new Date(),
      };

      this.logger.info(
        { videoId },
        'Published to YouTube successfully'
      );

      return result;
    } catch (error) {
      this.logger.error({ error }, 'Failed to publish to YouTube');
      throw error;
    }
  }

  private async uploadVideo(options: YouTubePublishOptions): Promise<string> {
    const response = await pRetry(
      async () => {
        return await this.youtube.videos.insert({
          part: ['snippet', 'status'],
          requestBody: {
            snippet: {
              title: options.title,
              description: options.description || '',
              tags: options.tags || [],
              categoryId: options.categoryId || '22', // People & Blogs
            },
            status: {
              privacyStatus: options.privacy,
            },
          },
          media: {
            body: createReadStream(options.videoPath),
          },
        });
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

    return response.data.id!;
  }

  private async setThumbnail(
    videoId: string,
    thumbnailPath: string
  ): Promise<void> {
    await pRetry(
      async () => {
        await this.youtube.thumbnails.set({
          videoId,
          media: {
            body: createReadStream(thumbnailPath),
          },
        });
      },
      {
        retries: 3,
        onFailedAttempt: (error) => {
          this.logger.warn(
            { attempt: error.attemptNumber, error: error.message },
            'Thumbnail upload failed, retrying'
          );
        },
      }
    );
  }

  async getPublishStatus(videoId: string): Promise<any> {
    const response = await this.youtube.videos.list({
      part: ['snippet', 'status', 'statistics'],
      id: [videoId],
    });

    return response.data.items?.[0];
  }
}
