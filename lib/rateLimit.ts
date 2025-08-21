import { NextApiRequest, NextApiResponse } from 'next';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

class RateLimiter {
  public requests: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(private config: RateLimitConfig) {}

  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return false;
    }

    if (record.count >= this.config.maxRequests) {
      return true;
    }

    record.count++;
    return false;
  }

  getRemainingTime(identifier: string): number {
    const record = this.requests.get(identifier);
    if (!record) return 0;
    return Math.max(0, record.resetTime - Date.now());
  }

  cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.requests.entries());
    for (const [key, record] of entries) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Clean up expired records every 5 minutes
setInterval(() => {
  rateLimiters.forEach(limiter => limiter.cleanup());
}, 5 * 60 * 1000);

const rateLimiters = new Map<string, RateLimiter>();

export const createRateLimiter = (key: string, config: RateLimitConfig) => {
  if (!rateLimiters.has(key)) {
    rateLimiters.set(key, new RateLimiter(config));
  }
  return rateLimiters.get(key)!;
};

export const withRateLimit = (
  key: string,
  config: RateLimitConfig = { windowMs: 15 * 60 * 1000, maxRequests: 100 }
) => {
  return (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const identifier = req.headers['x-forwarded-for'] as string || 
                       req.connection.remoteAddress || 
                       'unknown';
      
      const limiter = createRateLimiter(key, config);
      
      if (limiter.isRateLimited(identifier)) {
        const remainingTime = limiter.getRemainingTime(identifier);
        return res.status(429).json({
          error: 'Too many requests',
          message: config.message || 'Rate limit exceeded',
          retryAfter: Math.ceil(remainingTime / 1000),
        });
      }

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', 
        config.maxRequests - (limiter.requests.get(identifier)?.count || 0));
      res.setHeader('X-RateLimit-Reset', 
        Math.ceil((limiter.requests.get(identifier)?.resetTime || 0) / 1000));

      return handler(req, res);
    };
  };
};
