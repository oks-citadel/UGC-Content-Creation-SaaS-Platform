import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock axios before importing connectors
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('pino', () => ({
  default: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}));

vi.mock('../../../../services/integration-service/src/config', () => ({
  config: {
    tiktok: {
      clientKey: 'test_tiktok_client_key',
      clientSecret: 'test_tiktok_client_secret',
    },
    meta: {
      appId: 'test_meta_app_id',
      appSecret: 'test_meta_app_secret',
    },
  },
}));

import axios from 'axios';
import { TikTokConnector } from '../../../../services/integration-service/src/connectors/social/tiktok';
import { MetaConnector } from '../../../../services/integration-service/src/connectors/social/meta';

describe('TikTokConnector OAuth Flow', () => {
  let tiktokConnector: TikTokConnector;

  beforeEach(() => {
    tiktokConnector = new TikTokConnector();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAuthorizationUrl', () => {
    it('should generate correct TikTok authorization URL', async () => {
      const state = 'random-state-123';
      const redirectUri = 'https://app.example.com/callback';

      const url = await tiktokConnector.getAuthorizationUrl(state, redirectUri);

      expect(url).toContain('https://www.tiktok.com/v2/auth/authorize');
      expect(url).toContain(`client_key=test_tiktok_client_key`);
      expect(url).toContain(`state=${state}`);
      expect(url).toContain(`redirect_uri=${encodeURIComponent(redirectUri)}`);
      expect(url).toContain('response_type=code');
    });

    it('should include required scopes in authorization URL', async () => {
      const url = await tiktokConnector.getAuthorizationUrl('state', 'https://app.example.com/callback');

      expect(url).toContain('scope=');
      expect(url).toContain('user.info.basic');
      expect(url).toContain('video.list');
      expect(url).toContain('video.upload');
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange authorization code for tokens successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            access_token: 'tiktok_access_token_123',
            refresh_token: 'tiktok_refresh_token_456',
            expires_in: 86400,
            scope: 'user.info.basic,video.list,video.upload',
          },
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const tokens = await tiktokConnector.exchangeCodeForTokens(
        'auth_code_123',
        'https://app.example.com/callback'
      );

      expect(tokens.accessToken).toBe('tiktok_access_token_123');
      expect(tokens.refreshToken).toBe('tiktok_refresh_token_456');
      expect(tokens.expiresIn).toBe(86400);
      expect(tokens.scope).toEqual(['user.info.basic', 'video.list', 'video.upload']);
    });

    it('should throw error on failed token exchange', async () => {
      vi.mocked(axios.post).mockRejectedValue(new Error('Network error'));

      await expect(
        tiktokConnector.exchangeCodeForTokens('invalid_code', 'https://app.example.com/callback')
      ).rejects.toThrow('Failed to authenticate with TikTok');
    });

    it('should call TikTok token endpoint with correct parameters', async () => {
      const mockResponse = {
        data: {
          data: {
            access_token: 'token',
            refresh_token: 'refresh',
            expires_in: 86400,
            scope: 'user.info.basic',
          },
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      await tiktokConnector.exchangeCodeForTokens('code123', 'https://callback.com');

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('tiktok'),
        expect.objectContaining({
          client_key: 'test_tiktok_client_key',
          client_secret: 'test_tiktok_client_secret',
          code: 'code123',
          grant_type: 'authorization_code',
        })
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            access_token: 'new_access_token_789',
            refresh_token: 'new_refresh_token_012',
            expires_in: 86400,
            scope: 'user.info.basic,video.list',
          },
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const tokens = await tiktokConnector.refreshAccessToken('old_refresh_token');

      expect(tokens.accessToken).toBe('new_access_token_789');
      expect(tokens.refreshToken).toBe('new_refresh_token_012');
    });

    it('should throw error on refresh failure', async () => {
      vi.mocked(axios.post).mockRejectedValue(new Error('Refresh failed'));

      await expect(
        tiktokConnector.refreshAccessToken('invalid_refresh_token')
      ).rejects.toThrow('Failed to refresh TikTok access token');
    });

    it('should use refresh_token grant type', async () => {
      const mockResponse = {
        data: {
          data: {
            access_token: 'new_token',
            refresh_token: 'new_refresh',
            expires_in: 86400,
            scope: 'user.info.basic',
          },
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      await tiktokConnector.refreshAccessToken('refresh_token_123');

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          grant_type: 'refresh_token',
          refresh_token: 'refresh_token_123',
        })
      );
    });
  });

  describe('getUserInfo', () => {
    it('should fetch user info successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            user: {
              open_id: 'tiktok_user_123',
              union_id: 'union_456',
              display_name: 'Test Creator',
              avatar_url: 'https://avatar.tiktok.com/user123.jpg',
              follower_count: 10000,
              following_count: 500,
              video_count: 50,
            },
          },
        },
      };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const userInfo = await tiktokConnector.getUserInfo('access_token_123');

      expect(userInfo.openId).toBe('tiktok_user_123');
      expect(userInfo.unionId).toBe('union_456');
      expect(userInfo.displayName).toBe('Test Creator');
      expect(userInfo.followerCount).toBe(10000);
    });

    it('should throw error on getUserInfo failure', async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error('API error'));

      await expect(
        tiktokConnector.getUserInfo('invalid_token')
      ).rejects.toThrow('Failed to get TikTok user info');
    });

    it('should include Authorization header', async () => {
      const mockResponse = {
        data: {
          data: {
            user: {
              open_id: 'user123',
              union_id: 'union123',
              display_name: 'Test',
              avatar_url: 'https://example.com/avatar.jpg',
            },
          },
        },
      };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      await tiktokConnector.getUserInfo('my_access_token');

      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my_access_token',
          }),
        })
      );
    });
  });

  describe('getVideos', () => {
    it('should fetch user videos successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            videos: [
              {
                id: 'video_123',
                title: 'My First Video',
                video_description: 'A great video',
                cover_image_url: 'https://cover.tiktok.com/video123.jpg',
                share_url: 'https://tiktok.com/@user/video/123',
                duration: 30,
                view_count: 5000,
                like_count: 200,
                comment_count: 50,
                share_count: 10,
                create_time: 1700000000,
              },
            ],
            cursor: 'next_cursor_123',
            has_more: true,
          },
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await tiktokConnector.getVideos('access_token');

      expect(result.videos).toHaveLength(1);
      expect(result.videos[0].id).toBe('video_123');
      expect(result.videos[0].viewCount).toBe(5000);
      expect(result.hasMore).toBe(true);
      expect(result.cursor).toBe('next_cursor_123');
    });

    it('should handle pagination with cursor', async () => {
      const mockResponse = {
        data: {
          data: {
            videos: [],
            cursor: null,
            has_more: false,
          },
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      await tiktokConnector.getVideos('access_token', 'previous_cursor', 10);

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          cursor: 'previous_cursor',
          max_count: 10,
        }),
        expect.any(Object)
      );
    });

    it('should throw error on getVideos failure', async () => {
      vi.mocked(axios.post).mockRejectedValue(new Error('API error'));

      await expect(tiktokConnector.getVideos('invalid_token')).rejects.toThrow(
        'Failed to get TikTok videos'
      );
    });
  });

  describe('uploadVideo', () => {
    it('should initiate video upload successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            publish_id: 'publish_123',
          },
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await tiktokConnector.uploadVideo(
        'access_token',
        'https://videos.example.com/video.mp4',
        'My Video Title',
        'Video description'
      );

      expect(result.videoId).toBe('publish_123');
    });

    it('should throw error on upload failure', async () => {
      vi.mocked(axios.post).mockRejectedValue(new Error('Upload failed'));

      await expect(
        tiktokConnector.uploadVideo(
          'access_token',
          'https://videos.example.com/video.mp4',
          'Title'
        )
      ).rejects.toThrow('Failed to upload video to TikTok');
    });
  });

  describe('getVideoAnalytics', () => {
    it('should fetch video analytics successfully', async () => {
      const mockResponse = {
        data: {
          data: {
            videos: [
              { id: 'video1', view_count: 1000 },
              { id: 'video2', view_count: 2000 },
            ],
          },
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const analytics = await tiktokConnector.getVideoAnalytics('access_token', ['video1', 'video2']);

      expect(analytics).toHaveLength(2);
    });

    it('should throw error on analytics fetch failure', async () => {
      vi.mocked(axios.post).mockRejectedValue(new Error('API error'));

      await expect(
        tiktokConnector.getVideoAnalytics('token', ['video1'])
      ).rejects.toThrow('Failed to get TikTok video analytics');
    });
  });
});

describe('MetaConnector OAuth Flow', () => {
  let metaConnector: MetaConnector;

  beforeEach(() => {
    metaConnector = new MetaConnector();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAuthorizationUrl', () => {
    it('should generate correct Meta authorization URL', async () => {
      const state = 'random-state-456';
      const redirectUri = 'https://app.example.com/meta/callback';
      const scopes = ['public_profile', 'email', 'pages_manage_posts'];

      const url = await metaConnector.getAuthorizationUrl(state, redirectUri, scopes);

      expect(url).toContain('https://www.facebook.com/v18.0/dialog/oauth');
      expect(url).toContain(`client_id=test_meta_app_id`);
      expect(url).toContain(`state=${state}`);
      expect(url).toContain(`redirect_uri=${encodeURIComponent(redirectUri)}`);
      expect(url).toContain('response_type=code');
    });

    it('should include all requested scopes', async () => {
      const scopes = ['public_profile', 'email', 'pages_manage_posts', 'instagram_basic'];

      const url = await metaConnector.getAuthorizationUrl(
        'state',
        'https://callback.com',
        scopes
      );

      expect(url).toContain(`scope=${scopes.join(',')}`);
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange authorization code for tokens', async () => {
      const mockResponse = {
        data: {
          access_token: 'meta_short_lived_token_123',
          expires_in: 3600,
          token_type: 'Bearer',
        },
      };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const tokens = await metaConnector.exchangeCodeForTokens(
        'auth_code_456',
        'https://callback.example.com'
      );

      expect(tokens.accessToken).toBe('meta_short_lived_token_123');
      expect(tokens.expiresIn).toBe(3600);
      expect(tokens.tokenType).toBe('Bearer');
    });

    it('should throw error on failed token exchange', async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error('OAuth error'));

      await expect(
        metaConnector.exchangeCodeForTokens('invalid_code', 'https://callback.com')
      ).rejects.toThrow('Failed to authenticate with Meta');
    });

    it('should call Meta OAuth endpoint with correct parameters', async () => {
      const mockResponse = {
        data: {
          access_token: 'token',
          expires_in: 3600,
          token_type: 'Bearer',
        },
      };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      await metaConnector.exchangeCodeForTokens('mycode', 'https://redirect.com');

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('oauth/access_token'),
        expect.objectContaining({
          params: expect.objectContaining({
            client_id: 'test_meta_app_id',
            client_secret: 'test_meta_app_secret',
            code: 'mycode',
            redirect_uri: 'https://redirect.com',
          }),
        })
      );
    });
  });

  describe('getLongLivedToken', () => {
    it('should exchange short-lived token for long-lived token', async () => {
      const mockResponse = {
        data: {
          access_token: 'meta_long_lived_token_789',
          expires_in: 5184000, // 60 days
        },
      };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const tokens = await metaConnector.getLongLivedToken('short_lived_token');

      expect(tokens.accessToken).toBe('meta_long_lived_token_789');
      expect(tokens.expiresIn).toBe(5184000);
      expect(tokens.tokenType).toBe('Bearer');
    });

    it('should throw error on long-lived token exchange failure', async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error('Exchange failed'));

      await expect(
        metaConnector.getLongLivedToken('invalid_short_token')
      ).rejects.toThrow('Failed to get long-lived Meta token');
    });

    it('should use fb_exchange_token grant type', async () => {
      const mockResponse = {
        data: {
          access_token: 'long_token',
          expires_in: 5184000,
        },
      };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      await metaConnector.getLongLivedToken('short_token_123');

      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            grant_type: 'fb_exchange_token',
            fb_exchange_token: 'short_token_123',
          }),
        })
      );
    });
  });

  describe('getUserInfo', () => {
    it('should fetch Meta user info successfully', async () => {
      const mockResponse = {
        data: {
          id: 'meta_user_123',
          name: 'Test User',
          email: 'test@example.com',
          picture: {
            data: {
              url: 'https://graph.facebook.com/user123/picture',
            },
          },
        },
      };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const userInfo = await metaConnector.getUserInfo('access_token_123');

      expect(userInfo.id).toBe('meta_user_123');
      expect(userInfo.name).toBe('Test User');
      expect(userInfo.email).toBe('test@example.com');
      expect(userInfo.picture).toBe('https://graph.facebook.com/user123/picture');
    });

    it('should throw error on getUserInfo failure', async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error('API error'));

      await expect(
        metaConnector.getUserInfo('invalid_token')
      ).rejects.toThrow('Failed to get Meta user info');
    });

    it('should request appropriate fields', async () => {
      const mockResponse = {
        data: {
          id: 'user123',
          name: 'Test',
        },
      };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      await metaConnector.getUserInfo('token');

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/me'),
        expect.objectContaining({
          params: expect.objectContaining({
            fields: 'id,name,email,picture',
          }),
        })
      );
    });
  });

  describe('getPages', () => {
    it('should fetch user pages successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 'page_123',
              name: 'My Business Page',
              category: 'Business',
              access_token: 'page_token_123',
              followers_count: 5000,
            },
            {
              id: 'page_456',
              name: 'My Personal Page',
              category: 'Personal',
              access_token: 'page_token_456',
              followers_count: 1000,
            },
          ],
        },
      };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const pages = await metaConnector.getPages('access_token');

      expect(pages).toHaveLength(2);
      expect(pages[0].id).toBe('page_123');
      expect(pages[0].name).toBe('My Business Page');
      expect(pages[0].accessToken).toBe('page_token_123');
      expect(pages[0].followerCount).toBe(5000);
    });

    it('should throw error on getPages failure', async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error('API error'));

      await expect(metaConnector.getPages('token')).rejects.toThrow(
        'Failed to get Facebook pages'
      );
    });
  });

  describe('publishPost', () => {
    it('should publish post successfully', async () => {
      const mockResponse = {
        data: {
          id: 'post_123456',
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const result = await metaConnector.publishPost(
        'page_token',
        'page_123',
        'Hello World!'
      );

      expect(result.id).toBe('post_123456');
    });

    it('should include link in post', async () => {
      const mockResponse = {
        data: { id: 'post_123' },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      await metaConnector.publishPost(
        'page_token',
        'page_123',
        'Check this out!',
        'https://example.com/article'
      );

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        null,
        expect.objectContaining({
          params: expect.objectContaining({
            link: 'https://example.com/article',
          }),
        })
      );
    });

    it('should throw error on publish failure', async () => {
      vi.mocked(axios.post).mockRejectedValue(new Error('Publish failed'));

      await expect(
        metaConnector.publishPost('token', 'page_id', 'Message')
      ).rejects.toThrow('Failed to publish Facebook post');
    });
  });

  describe('getInstagramAccount', () => {
    it('should fetch Instagram business account', async () => {
      vi.mocked(axios.get)
        .mockResolvedValueOnce({
          data: {
            instagram_business_account: { id: 'ig_account_123' },
          },
        })
        .mockResolvedValueOnce({
          data: {
            id: 'ig_account_123',
            username: 'testcreator',
            name: 'Test Creator',
            profile_picture_url: 'https://instagram.com/pic.jpg',
            followers_count: 25000,
            media_count: 150,
          },
        });

      const igAccount = await metaConnector.getInstagramAccount('page_token', 'page_123');

      expect(igAccount?.id).toBe('ig_account_123');
      expect(igAccount?.username).toBe('testcreator');
      expect(igAccount?.followerCount).toBe(25000);
    });

    it('should return null if no Instagram account linked', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: {},
      });

      const igAccount = await metaConnector.getInstagramAccount('page_token', 'page_123');

      expect(igAccount).toBeNull();
    });

    it('should throw error on failure', async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error('API error'));

      await expect(
        metaConnector.getInstagramAccount('token', 'page_id')
      ).rejects.toThrow('Failed to get Instagram account');
    });
  });

  describe('publishInstagramPost', () => {
    it('should publish Instagram post successfully', async () => {
      vi.mocked(axios.post)
        .mockResolvedValueOnce({ data: { id: 'container_123' } })
        .mockResolvedValueOnce({ data: { id: 'media_post_456' } });

      const result = await metaConnector.publishInstagramPost(
        'page_token',
        'ig_account_123',
        'https://example.com/image.jpg',
        'My caption #hashtag'
      );

      expect(result.id).toBe('media_post_456');
    });

    it('should throw error on Instagram publish failure', async () => {
      vi.mocked(axios.post).mockRejectedValue(new Error('Publish failed'));

      await expect(
        metaConnector.publishInstagramPost(
          'token',
          'ig_id',
          'https://example.com/img.jpg'
        )
      ).rejects.toThrow('Failed to publish Instagram post');
    });
  });

  describe('getInstagramMedia', () => {
    it('should fetch Instagram media successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 'media_1',
              caption: 'First post',
              media_type: 'IMAGE',
              media_url: 'https://instagram.com/media1.jpg',
              permalink: 'https://instagram.com/p/abc123',
              timestamp: '2024-01-15T10:00:00Z',
              like_count: 100,
              comments_count: 10,
            },
            {
              id: 'media_2',
              caption: 'Second post',
              media_type: 'VIDEO',
              media_url: 'https://instagram.com/media2.mp4',
              permalink: 'https://instagram.com/p/def456',
              timestamp: '2024-01-14T10:00:00Z',
              like_count: 250,
              comments_count: 25,
            },
          ],
        },
      };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const media = await metaConnector.getInstagramMedia('page_token', 'ig_123', 10);

      expect(media).toHaveLength(2);
      expect(media[0].mediaType).toBe('IMAGE');
      expect(media[1].mediaType).toBe('VIDEO');
      expect(media[0].likeCount).toBe(100);
    });

    it('should throw error on getInstagramMedia failure', async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error('API error'));

      await expect(
        metaConnector.getInstagramMedia('token', 'ig_id')
      ).rejects.toThrow('Failed to get Instagram media');
    });
  });

  describe('getPostInsights', () => {
    it('should fetch post insights successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            { name: 'post_impressions', values: [{ value: 1500 }] },
            { name: 'post_engaged_users', values: [{ value: 200 }] },
            { name: 'post_clicks', values: [{ value: 50 }] },
          ],
        },
      };

      vi.mocked(axios.get).mockResolvedValue(mockResponse);

      const insights = await metaConnector.getPostInsights('page_token', 'post_123');

      expect(insights).toHaveLength(3);
      expect(insights[0].name).toBe('post_impressions');
    });

    it('should throw error on getPostInsights failure', async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error('API error'));

      await expect(
        metaConnector.getPostInsights('token', 'post_id')
      ).rejects.toThrow('Failed to get post insights');
    });
  });
});

describe('OAuth Error Handling', () => {
  describe('TikTok Error Scenarios', () => {
    let tiktokConnector: TikTokConnector;

    beforeEach(() => {
      tiktokConnector = new TikTokConnector();
      vi.clearAllMocks();
    });

    it('should handle network timeout', async () => {
      vi.mocked(axios.post).mockRejectedValue(new Error('Network timeout'));

      await expect(
        tiktokConnector.exchangeCodeForTokens('code', 'https://callback.com')
      ).rejects.toThrow('Failed to authenticate with TikTok');
    });

    it('should handle invalid response format', async () => {
      vi.mocked(axios.post).mockResolvedValue({ data: null });

      await expect(
        tiktokConnector.exchangeCodeForTokens('code', 'https://callback.com')
      ).rejects.toThrow();
    });

    it('should handle rate limiting', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).response = { status: 429 };
      vi.mocked(axios.get).mockRejectedValue(rateLimitError);

      await expect(tiktokConnector.getUserInfo('token')).rejects.toThrow();
    });
  });

  describe('Meta Error Scenarios', () => {
    let metaConnector: MetaConnector;

    beforeEach(() => {
      metaConnector = new MetaConnector();
      vi.clearAllMocks();
    });

    it('should handle expired token', async () => {
      const expiredTokenError = new Error('Token expired');
      (expiredTokenError as any).response = { status: 401 };
      vi.mocked(axios.get).mockRejectedValue(expiredTokenError);

      await expect(metaConnector.getUserInfo('expired_token')).rejects.toThrow();
    });

    it('should handle permission denied', async () => {
      const permissionError = new Error('Permission denied');
      (permissionError as any).response = { status: 403 };
      vi.mocked(axios.post).mockRejectedValue(permissionError);

      await expect(
        metaConnector.publishPost('token', 'page_id', 'message')
      ).rejects.toThrow();
    });

    it('should handle server error', async () => {
      const serverError = new Error('Internal server error');
      (serverError as any).response = { status: 500 };
      vi.mocked(axios.get).mockRejectedValue(serverError);

      await expect(metaConnector.getPages('token')).rejects.toThrow();
    });
  });
});

describe('OAuth Token Validation', () => {
  describe('Token Expiry', () => {
    it('should handle token near expiry', async () => {
      const tiktokConnector = new TikTokConnector();
      const mockResponse = {
        data: {
          data: {
            access_token: 'short_lived_token',
            refresh_token: 'refresh_token',
            expires_in: 60, // Only 1 minute
            scope: 'user.info.basic',
          },
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const tokens = await tiktokConnector.exchangeCodeForTokens('code', 'https://callback.com');

      expect(tokens.expiresIn).toBe(60);
    });
  });

  describe('Scope Validation', () => {
    it('should parse scope string correctly', async () => {
      const tiktokConnector = new TikTokConnector();
      const mockResponse = {
        data: {
          data: {
            access_token: 'token',
            refresh_token: 'refresh',
            expires_in: 86400,
            scope: 'scope1,scope2,scope3',
          },
        },
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);

      const tokens = await tiktokConnector.exchangeCodeForTokens('code', 'https://callback.com');

      expect(tokens.scope).toEqual(['scope1', 'scope2', 'scope3']);
    });
  });
});
