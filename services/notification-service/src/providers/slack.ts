import axios from 'axios';
import { config } from '../config';
import pino from 'pino';

const logger = pino({ name: 'slack-provider' });

export interface SlackMessage {
  channel?: string;
  text: string;
  blocks?: any[];
  attachments?: any[];
  username?: string;
  iconEmoji?: string;
  iconUrl?: string;
  threadTs?: string;
}

export class SlackProvider {
  async send(message: SlackMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!config.slack.webhookUrl && !config.slack.token) {
        throw new Error('Slack webhook URL or token not configured');
      }

      let response;

      if (config.slack.webhookUrl) {
        // Use webhook for simple messages
        response = await axios.post(config.slack.webhookUrl, {
          text: message.text,
          blocks: message.blocks,
          attachments: message.attachments,
          username: message.username,
          icon_emoji: message.iconEmoji,
          icon_url: message.iconUrl,
        });
      } else if (config.slack.token) {
        // Use Web API for more control
        response = await axios.post(
          'https://slack.com/api/chat.postMessage',
          {
            channel: message.channel || '#general',
            text: message.text,
            blocks: message.blocks,
            attachments: message.attachments,
            username: message.username,
            icon_emoji: message.iconEmoji,
            icon_url: message.iconUrl,
            thread_ts: message.threadTs,
          },
          {
            headers: {
              Authorization: `Bearer ${config.slack.token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.data.ok) {
          throw new Error(response.data.error || 'Failed to send Slack message');
        }
      }

      logger.info({ channel: message.channel }, 'Slack message sent successfully');

      return {
        success: true,
        messageId: response?.data?.ts,
      };
    } catch (error: any) {
      logger.error({ error, channel: message.channel }, 'Failed to send Slack message');

      return {
        success: false,
        error: error.message || 'Failed to send Slack message',
      };
    }
  }

  async sendRich(
    channel: string,
    title: string,
    text: string,
    color?: string,
    fields?: Array<{ title: string; value: string; short?: boolean }>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.send({
      channel,
      text: title,
      attachments: [
        {
          color: color || '#36a64f',
          title,
          text,
          fields,
          footer: 'NEXUS Platform',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    });
  }

  async sendBlocks(
    channel: string,
    text: string,
    blocks: any[]
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.send({
      channel,
      text,
      blocks,
    });
  }
}

export const slackProvider = new SlackProvider();
