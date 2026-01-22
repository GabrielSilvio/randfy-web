import { RequestManager } from '../request-manager';

// Mock fetch
global.fetch = jest.fn();

describe('RequestManager', () => {
  let manager: RequestManager;

  beforeEach(() => {
    manager = new RequestManager();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('fetch with timeout', () => {
    it('should complete successful request', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'test' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await manager.fetch('http://test.com', { timeout: 5000 });
      expect(result).toEqual({ data: 'test' });
    });
  });

  describe('retry logic', () => {
    it('should not retry on 400 errors', async () => {
      const mockError = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Error message',
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockError);

      await expect(
        manager.fetch('http://test.com', { retries: 2, timeout: 1000 })
      ).rejects.toThrow();

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('request deduplication', () => {
    it('should deduplicate identical requests', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'test' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const promise1 = manager.fetch('http://test.com', {
        method: 'GET',
        dedupe: true,
      });
      const promise2 = manager.fetch('http://test.com', {
        method: 'GET',
        dedupe: true,
      });

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toEqual(result2);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should not deduplicate when disabled', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'test' }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await manager.fetch('http://test.com', { dedupe: false });
      await manager.fetch('http://test.com', { dedupe: false });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('cancelAll', () => {
    it('should cancel all inflight requests', () => {
      const mockAbort = jest.fn();
      const mockAbortController = {
        abort: mockAbort,
        signal: {},
      };

      global.AbortController = jest.fn(() => mockAbortController) as any;

      manager.fetch('http://test.com', {});
      manager.cancelAll();

      // Should have aborted
      expect(mockAbort).toHaveBeenCalled();
    });
  });
});
