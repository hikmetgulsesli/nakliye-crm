import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
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
}));

// Mock next/head
vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));
