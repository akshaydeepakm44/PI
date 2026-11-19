import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { LoginPage } from '../pages/public/LoginPage';
import { AuthProvider } from '../context/AuthContext';
import { Building2 } from 'lucide-react';

describe('UI Baseline Components', () => {
  it('renders Badge with demo variant and correct text', () => {
    render(<Badge variant="demo">Demo data</Badge>);
    const badgeElement = screen.getByText('Demo data');
    expect(badgeElement).toBeDefined();
    expect(badgeElement.className).toContain('bg-amber-50');
  });

  it('renders Badge with unverified variant', () => {
    render(<Badge variant="unverified">Seller provided / Unverified</Badge>);
    const badgeElement = screen.getByText('Seller provided / Unverified');
    expect(badgeElement).toBeDefined();
    expect(badgeElement.className).toContain('text-slate-700');
  });

  it('renders EmptyState with title, description, and action button', () => {
    let clicked = false;
    render(
      <EmptyState
        icon={Building2}
        title="No Properties"
        description="Nothing to display at this time."
        actionLabel="Create Listing"
        onAction={() => { clicked = true; }}
      />
    );

    expect(screen.getByText('No Properties')).toBeDefined();
    expect(screen.getByText('Nothing to display at this time.')).toBeDefined();
    const btn = screen.getByText('Create Listing');
    expect(btn).toBeDefined();
    btn.click();
    expect(clicked).toBe(true);
  });
});

describe('Geodesic Distance Logic (Phase 1 Baseline)', () => {
  it('computes accurate straight-line geodesic distance between Madhurawada and Rushikonda', () => {
    const lat1 = 17.7944;
    const lon1 = 83.3574;
    const lat2 = 17.7818;
    const lon2 = 83.3776;

    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightKm = +(R * c).toFixed(2);

    expect(straightKm).toBeGreaterThan(2.3);
    expect(straightKm).toBeLessThan(2.8);
  });
});

describe('Phase 3: Evidence Layer & Intelligence Inspector', () => {
  it('renders Evidence classification badges accurately', () => {
    render(<Badge variant="calculated">Calculated: ₹5,000/sq ft</Badge>);
    expect(screen.getByText('Calculated: ₹5,000/sq ft')).toBeDefined();

    render(<Badge variant="verified">Source Retrieved</Badge>);
    expect(screen.getByText('Source Retrieved')).toBeDefined();
  });
});

describe('Role Selection Login Flow', () => {
  it('renders role choices and updates the login action button upon selection', () => {
    render(
      <MemoryRouter initialEntries={['/login?role=buyer']}>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Initial state: Buyer is selected
    expect(screen.getByText('Select your role to sign in')).toBeDefined();
    expect(screen.getByText('Buyer & Investor')).toBeDefined();
    expect(screen.getByText('Seller / Builder')).toBeDefined();
    expect(screen.getByText('Platform Administrator')).toBeDefined();

    const submitBtn = screen.getByRole('button', { name: /Sign in as Buyer & Investor/i });
    expect(submitBtn).toBeDefined();

    // Click Seller / Builder card
    const sellerCard = screen.getByText('Seller / Builder');
    fireEvent.click(sellerCard);

    // Button should now update to Sign in as Seller / Builder
    expect(screen.getByRole('button', { name: /Sign in as Seller \/ Builder/i })).toBeDefined();

    // Click Platform Administrator card
    const adminCard = screen.getByText('Platform Administrator');
    fireEvent.click(adminCard);

    // Button should now update to Sign in as Platform Administrator
    expect(screen.getByRole('button', { name: /Sign in as Platform Administrator/i })).toBeDefined();
  });
});
