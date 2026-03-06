import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js navigation
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation');
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    }),
    useParams: () => ({}),
    useSearchParams: () => ({
      get: vi.fn(),
      has: vi.fn(),
      toString: () => '',
    }),
    usePathname: () => '',
    redirect: vi.fn(),
  };
});

// Mock next/head
vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn((name: string) => {
      if (name === 'session') {
        return {
          value: JSON.stringify({
            user: {
              id: '1',
              email: 'admin@example.com',
              full_name: 'Admin User',
              role: 'admin',
            },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }),
        };
      }
      return null;
    }),
    set: vi.fn(),
    delete: vi.fn(),
    has: vi.fn((name: string) => name === 'session'),
  }),
  headers: () => ({
    get: vi.fn(() => null),
    has: vi.fn(() => false),
  }),
}));
