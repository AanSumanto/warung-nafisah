import { describe, it, expect } from 'vitest';
import {
  parseRedisUrl,
  maskRedisUrl,
  detectRedisProvider,
  formatRedisErrorReason,
  toRedisConnectionConfig,
  RedisUrlParseError,
} from '../../../src/config/redis-url.js';

describe('parseRedisUrl', () => {
  it('parses local redis OSS URL', () => {
    const parsed = parseRedisUrl('redis://localhost:6379');
    expect(parsed.protocol).toBe('redis');
    expect(parsed.host).toBe('localhost');
    expect(parsed.port).toBe(6379);
    expect(parsed.tls).toBe(false);
    expect(parsed.username).toBeUndefined();
    expect(parsed.password).toBeUndefined();
  });

  it('parses Redis Cloud URL with default username', () => {
    const parsed = parseRedisUrl('rediss://default:secret-pass@redis-12345.cloud.redislabs.com:6379');
    expect(parsed.protocol).toBe('rediss');
    expect(parsed.tls).toBe(true);
    expect(parsed.username).toBe('default');
    expect(parsed.password).toBe('secret-pass');
    expect(parsed.host).toBe('redis-12345.cloud.redislabs.com');
  });

  it('parses Upstash URL with token password', () => {
    const parsed = parseRedisUrl('rediss://default:AbCdEf123@us1-example-12345.upstash.io:6379');
    expect(parsed.tls).toBe(true);
    expect(parsed.password).toBe('AbCdEf123');
    expect(detectRedisProvider(parsed.host)).toBe('upstash');
  });

  it('parses URL with custom username', () => {
    const parsed = parseRedisUrl('rediss://myuser:mypass@host.example.com:6380');
    expect(parsed.username).toBe('myuser');
    expect(parsed.password).toBe('mypass');
    expect(parsed.port).toBe(6380);
  });

  it('defaults port to 6379 when omitted', () => {
    const parsed = parseRedisUrl('redis://127.0.0.1');
    expect(parsed.port).toBe(6379);
  });

  it('throws on invalid protocol', () => {
    expect(() => parseRedisUrl('http://localhost:6379')).toThrow(RedisUrlParseError);
  });

  it('throws on invalid URL', () => {
    expect(() => parseRedisUrl('not-a-url')).toThrow(RedisUrlParseError);
  });
});

describe('maskRedisUrl', () => {
  it('masks password in connection string', () => {
    const masked = maskRedisUrl('rediss://default:super-secret@host:6379');
    expect(masked).not.toContain('super-secret');
    expect(masked).toContain('***');
    expect(masked).toContain('host:6379');
  });

  it('does not expose password for local redis', () => {
    const masked = maskRedisUrl('redis://localhost:6379');
    expect(masked).toBe('redis://localhost:6379');
  });
});

describe('toRedisConnectionConfig', () => {
  it('enables TLS for rediss protocol', () => {
    const parsed = parseRedisUrl('rediss://default:pass@host:6379');
    const config = toRedisConnectionConfig(parsed);
    expect(config.tls).toEqual({});
    expect(config.password).toBe('pass');
    expect(config.username).toBe('default');
    expect(config.lazyConnect).toBe(true);
  });

  it('omits TLS for redis protocol', () => {
    const parsed = parseRedisUrl('redis://localhost:6379');
    const config = toRedisConnectionConfig(parsed);
    expect(config.tls).toBeUndefined();
  });
});

describe('formatRedisErrorReason', () => {
  it('maps NOAUTH to clear message', () => {
    expect(formatRedisErrorReason(new Error('NOAUTH Authentication required.'))).toContain(
      'Authentication failed',
    );
  });

  it('maps TLS errors', () => {
    expect(formatRedisErrorReason(new Error('TLS certificate verify failed'))).toContain('TLS');
  });
});

describe('detectRedisProvider', () => {
  it('detects upstash', () => {
    expect(detectRedisProvider('us1-xyz.upstash.io')).toBe('upstash');
  });

  it('detects redis cloud', () => {
    expect(detectRedisProvider('abc.redislabs.com')).toBe('redis-cloud');
  });

  it('defaults to redis-oss', () => {
    expect(detectRedisProvider('localhost')).toBe('redis-oss');
  });
});
