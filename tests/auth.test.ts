/**
 * Tests for Authentication Middleware
 */

import { generateToken, verifyToken } from '../src/middleware/auth';

describe('Authentication', () => {
  describe('Token Generation', () => {
    test('should generate a valid JWT token', () => {
      const payload = {
        userId: 'test-user-123',
        walletAddress: '0x1234567890abcdef',
        role: 'user' as const,
      };

      const token = generateToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should include payload data in token', () => {
      const payload = {
        userId: 'test-user-456',
        walletAddress: '0xabcdef1234567890',
        role: 'admin' as const,
      };

      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.walletAddress).toBe(payload.walletAddress);
      expect(decoded?.role).toBe(payload.role);
    });
  });

  describe('Token Verification', () => {
    test('should verify a valid token', () => {
      const payload = {
        userId: 'test-user',
        walletAddress: '0x123',
        role: 'user' as const,
      };

      const token = generateToken(payload);
      const decoded = verifyToken(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(payload.userId);
    });

    test('should reject an invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyToken(invalidToken);
      
      expect(decoded).toBeNull();
    });

    test('should reject a malformed token', () => {
      const malformedToken = 'not-a-valid-jwt';
      const decoded = verifyToken(malformedToken);
      
      expect(decoded).toBeNull();
    });

    test('should handle empty token', () => {
      const decoded = verifyToken('');
      expect(decoded).toBeNull();
    });
  });

  describe('Token Security', () => {
    test('should generate different tokens for different payloads', () => {
      const payload1 = {
        userId: 'user-1',
        walletAddress: '0x111',
        role: 'user' as const,
      };

      const payload2 = {
        userId: 'user-2',
        walletAddress: '0x222',
        role: 'user' as const,
      };

      const token1 = generateToken(payload1);
      const token2 = generateToken(payload2);
      
      expect(token1).not.toBe(token2);
    });
  });
});
