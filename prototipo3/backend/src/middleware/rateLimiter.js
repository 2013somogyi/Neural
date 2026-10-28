// Simple and effective in-memory rate limiting middleware
const attempts = new Map();

function rateLimiter({ windowMs = 15 * 60 * 1000, max = 20, message = 'Muitas requisições. Tente novamente mais tarde.' } = {}) {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const key = `${ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();

    if (!attempts.has(key)) {
      attempts.set(key, []);
    }

    const timestamps = attempts.get(key).filter(ts => now - ts < windowMs);
    timestamps.push(now);
    attempts.set(key, timestamps);

    if (timestamps.length > max) {
      return res.status(429).json({ message });
    }

    next();
  };
}

module.exports = { rateLimiter };
