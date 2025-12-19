import { WebClient } from '@slack/web-api';
import pino from 'pino';
import pRetry from 'p-retry';

const logger = pino();

export interface SlackOptions {
  channel: string;
  text: string;
  blocks?: any[];
  threadTs?: string;
  attachments?: any[];
}

export class SlackProvider {
  private client: WebClient;
  private logger = logger.child({ provider: 'Slack' });

  constructor() {
    const token = process.env.SLACK_BOT_TOKEN;

    if (!token) {
      throw new Error('Slack bot token is not configured');
    }

    this.client = new WebClient(token);
  }

  async send(options: SlackOptions): Promise<void> {
    this.logger.info({ channel: options.channel }, 'Sending Slack message');

    try {
      await pRetry(
        async () => {
          await this.client.chat.postMessage({
            channel: options.channel,
            text: options.text,
            blocks: options.blocks,
            thread_ts: options.threadTs,
            attachments: options.attachments,
          });
        },
        {
          retries: 3,
          onFailedAttempt: (error) => {
            this.logger.warn(
              { attempt: error.attemptNumber, error: error.message },
              'Slack message failed, retrying'
            );
          },
        }
      );

      this.logger.info({ channel: options.channel }, 'Slack message sent successfully');
    } catch (error) {
      this.logger.error({ error, channel: options.channel }, 'Failed to send Slack message');
      throw error;
    }
  }

  async sendRichMessage(channel: string, title: string, message: string, fields?: Array<{ title: string; value: string; short?: boolean }>): Promise<void> {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: title,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
    ];

    if (fields && fields.length > 0) {
      blocks.push({
        type: 'section',
        fields: fields.map((field) => ({
          type: 'mrkdwn',
          text: `*${field.title}*\n${field.value}`,
        })),
      } as any);
    }

    await this.send({
      channel,
      text: title,
      blocks,
    });
  }
}
