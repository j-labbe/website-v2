import { describe, it, expect } from 'vitest';
import { sanitizePrivateRepo } from '../sanitize';

// Mock GitHub repo shape (raw API response)
const mockPrivateRepo = {
  id: 123456,
  full_name: 'j-labbe/super-secret-project',
  name: 'super-secret-project',
  html_url: 'https://github.com/j-labbe/super-secret-project',
  description: 'A very secret project with confidential details',
  private: true,
  fork: false,
  parent: null,
  created_at: '2025-06-15T10:30:00Z',
  pushed_at: '2026-02-10T14:22:00Z',
  topics: ['secret-topic', 'internal-tool'],
};

const mockMonthlyCommits: Record<string, number> = {
  '2025-06': 5,
  '2025-07': 12,
  '2026-01': 3,
  '2026-02': 8,
};

const mockLanguages: Record<string, number> = {
  TypeScript: 50000,
  Python: 20000,
  Shell: 5000,
};

describe('sanitizePrivateRepo', () => {
  it('should produce a ProjectEntry with only allowed fields', () => {
    const result = sanitizePrivateRepo(mockPrivateRepo, mockMonthlyCommits, mockLanguages);

    // Allowed fields must be present
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('isPrivate');
    expect(result).toHaveProperty('isFork');
    expect(result).toHaveProperty('parentRepo');
    expect(result).toHaveProperty('languages');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('lastActiveAt');
    expect(result).toHaveProperty('monthlyCommits');
    expect(result).toHaveProperty('totalCommits');

    // Disallowed fields MUST NOT be present
    expect(result).not.toHaveProperty('url');
    expect(result).not.toHaveProperty('description');
    expect(result).not.toHaveProperty('topics');
    expect(result).not.toHaveProperty('recentCommits');
  });

  it('should set name to "Private Repo" regardless of actual name', () => {
    const result = sanitizePrivateRepo(mockPrivateRepo, mockMonthlyCommits, mockLanguages);
    expect(result.name).toBe('Private Repo');
  });

  it('should set isPrivate to true', () => {
    const result = sanitizePrivateRepo(mockPrivateRepo, mockMonthlyCommits, mockLanguages);
    expect(result.isPrivate).toBe(true);
  });

  it('should generate id as first 16 hex chars of SHA-256 hash of full_name', () => {
    const result = sanitizePrivateRepo(mockPrivateRepo, mockMonthlyCommits, mockLanguages);
    // ID must be 16 hex chars
    expect(result.id).toMatch(/^[0-9a-f]{16}$/);
  });

  it('should produce stable hash (same input = same id)', () => {
    const result1 = sanitizePrivateRepo(mockPrivateRepo, mockMonthlyCommits, mockLanguages);
    const result2 = sanitizePrivateRepo(mockPrivateRepo, mockMonthlyCommits, mockLanguages);
    expect(result1.id).toBe(result2.id);
  });

  it('should NEVER contain the original repo full_name in serialized output', () => {
    const result = sanitizePrivateRepo(mockPrivateRepo, mockMonthlyCommits, mockLanguages);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('super-secret-project');
    expect(serialized).not.toContain('j-labbe/super-secret-project');
  });

  it('should NEVER contain the original repo html_url in serialized output', () => {
    const result = sanitizePrivateRepo(mockPrivateRepo, mockMonthlyCommits, mockLanguages);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('https://github.com/j-labbe/super-secret-project');
  });

  it('should NEVER contain the original description in serialized output', () => {
    const result = sanitizePrivateRepo(mockPrivateRepo, mockMonthlyCommits, mockLanguages);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('A very secret project');
    expect(serialized).not.toContain('confidential');
  });

  it('should NEVER contain topics in serialized output', () => {
    const result = sanitizePrivateRepo(mockPrivateRepo, mockMonthlyCommits, mockLanguages);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('secret-topic');
    expect(serialized).not.toContain('internal-tool');
  });

  it('should include language names only (no byte counts)', () => {
    const result = sanitizePrivateRepo(mockPrivateRepo, mockMonthlyCommits, mockLanguages);
    expect(result.languages).toEqual(['TypeScript', 'Python', 'Shell']);
    // Ensure no byte counts leak through
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('50000');
    expect(serialized).not.toContain('20000');
  });

  it('should slice dates to YYYY-MM-DD format', () => {
    const result = sanitizePrivateRepo(mockPrivateRepo, mockMonthlyCommits, mockLanguages);
    expect(result.createdAt).toBe('2025-06-15');
    expect(result.lastActiveAt).toBe('2026-02-10');
  });

  it('should pass through monthlyCommits and compute totalCommits', () => {
    const result = sanitizePrivateRepo(mockPrivateRepo, mockMonthlyCommits, mockLanguages);
    expect(result.monthlyCommits).toEqual(mockMonthlyCommits);
    expect(result.totalCommits).toBe(28); // 5 + 12 + 3 + 8
  });

  it('should set isFork to false for non-fork repos', () => {
    const result = sanitizePrivateRepo(mockPrivateRepo, mockMonthlyCommits, mockLanguages);
    expect(result.isFork).toBe(false);
    expect(result.parentRepo).toBeNull();
  });

  describe('fork handling', () => {
    it('should include parent info when forked from a public repo', () => {
      const forkedRepo = {
        ...mockPrivateRepo,
        fork: true,
        parent: {
          full_name: 'public-org/public-repo',
          html_url: 'https://github.com/public-org/public-repo',
          private: false,
        },
      };

      const result = sanitizePrivateRepo(forkedRepo, mockMonthlyCommits, mockLanguages);
      expect(result.isFork).toBe(true);
      expect(result.parentRepo).toEqual({
        name: 'public-org/public-repo',
        url: 'https://github.com/public-org/public-repo',
      });
    });

    it('should NOT include parent info when forked from a private repo', () => {
      const forkedFromPrivate = {
        ...mockPrivateRepo,
        fork: true,
        parent: {
          full_name: 'private-org/private-repo',
          html_url: 'https://github.com/private-org/private-repo',
          private: true,
        },
      };

      const result = sanitizePrivateRepo(forkedFromPrivate, mockMonthlyCommits, mockLanguages);
      expect(result.isFork).toBe(true);
      expect(result.parentRepo).toBeNull();
      // Verify the private parent info doesn't leak
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('private-org/private-repo');
    });

    it('should handle fork with no parent (edge case)', () => {
      const forkNoParent = {
        ...mockPrivateRepo,
        fork: true,
        parent: null,
      };

      const result = sanitizePrivateRepo(forkNoParent, mockMonthlyCommits, mockLanguages);
      expect(result.isFork).toBe(true);
      expect(result.parentRepo).toBeNull();
    });
  });
});
