import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge, PotentialBadge } from './badges';

describe('StatusBadge', () => {
  it('renders Aktif status correctly', () => {
    render(<StatusBadge status="Aktif" />);
    expect(screen.getByText('Aktif')).toBeInTheDocument();
  });

  it('renders Pasif status correctly', () => {
    render(<StatusBadge status="Pasif" />);
    expect(screen.getByText('Pasif')).toBeInTheDocument();
  });

  it('renders Soguk status correctly', () => {
    render(<StatusBadge status="Soguk" />);
    expect(screen.getByText('Soğuk')).toBeInTheDocument();
  });

  it('renders English status variants correctly', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('Aktif')).toBeInTheDocument();
  });
});

describe('PotentialBadge', () => {
  it('renders Yuksek potential correctly', () => {
    render(<PotentialBadge potential="Yuksek" />);
    expect(screen.getByText('Yüksek')).toBeInTheDocument();
  });

  it('renders Orta potential correctly', () => {
    render(<PotentialBadge potential="Orta" />);
    expect(screen.getByText('Orta')).toBeInTheDocument();
  });

  it('renders Dusuk potential correctly', () => {
    render(<PotentialBadge potential="Dusuk" />);
    expect(screen.getByText('Düşük')).toBeInTheDocument();
  });

  it('renders dash for null potential', () => {
    render(<PotentialBadge potential={null} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
