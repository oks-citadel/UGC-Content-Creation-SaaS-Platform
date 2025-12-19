import axios from 'axios';
import pino from 'pino';

const logger = pino({ name: 'meta-ads-connector' });

const META_GRAPH_API = 'https://graph.facebook.com/v18.0';

export class MetaAdsConnector {
  async getAdAccounts(accessToken: string) {
    try {
      const response = await axios.get(`${META_GRAPH_API}/me/adaccounts`, {
        params: {
          fields: 'id,name,account_status,currency,timezone_name',
          access_token: accessToken,
        },
      });

      return response.data.data;
    } catch (error: any) {
      logger.error({ error }, 'Failed to get ad accounts');
      throw new Error('Failed to get Meta ad accounts');
    }
  }

  async getCampaigns(accessToken: string, adAccountId: string) {
    try {
      const response = await axios.get(`${META_GRAPH_API}/${adAccountId}/campaigns`, {
        params: {
          fields: 'id,name,status,objective,created_time,updated_time',
          access_token: accessToken,
        },
      });

      return response.data.data;
    } catch (error: any) {
      logger.error({ error }, 'Failed to get campaigns');
      throw new Error('Failed to get Meta ad campaigns');
    }
  }

  async getCampaignInsights(accessToken: string, campaignId: string, datePreset: string = 'last_30d') {
    try {
      const response = await axios.get(`${META_GRAPH_API}/${campaignId}/insights`, {
        params: {
          fields: 'impressions,clicks,spend,cpc,cpm,ctr,reach,frequency',
          date_preset: datePreset,
          access_token: accessToken,
        },
      });

      return response.data.data[0] || null;
    } catch (error: any) {
      logger.error({ error }, 'Failed to get campaign insights');
      throw new Error('Failed to get Meta ad campaign insights');
    }
  }

  async createCampaign(accessToken: string, adAccountId: string, name: string, objective: string) {
    try {
      const response = await axios.post(
        `${META_GRAPH_API}/${adAccountId}/campaigns`,
        null,
        {
          params: {
            name,
            objective,
            status: 'PAUSED',
            access_token: accessToken,
          },
        }
      );

      return { id: response.data.id };
    } catch (error: any) {
      logger.error({ error }, 'Failed to create campaign');
      throw new Error('Failed to create Meta ad campaign');
    }
  }
}

export const metaAdsConnector = new MetaAdsConnector();
