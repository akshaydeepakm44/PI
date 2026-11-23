import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { StandoutAIAnalysis } from '../components/intelligence/StandoutAIAnalysis';

describe('StandoutAIAnalysis Component', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_AI_ANALYSIS_MODE', 'demo');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('1. Idle state on load: button visible, helper text visible, NO card or skeleton', () => {
    render(<StandoutAIAnalysis propertyId={1} city="Hyderabad" />);

    const button = screen.getByRole('button', { name: /What stands out/i });
    expect(button).toBeDefined();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByText('Compare against active peer projects in Hyderabad')).toBeDefined();

    // Card should not be visible on page load
    expect(screen.queryByText(/Distinctive signature/i)).toBeNull();
    expect(screen.queryByText(/STANDOUT METRICS/i)).toBeNull();
  });

  it('2. Clicking button transitions to loading state', () => {
    render(<StandoutAIAnalysis propertyId={1} city="Hyderabad" />);

    const button = screen.getByRole('button', { name: /What stands out/i });
    fireEvent.click(button);

    // Shows loading button and skeleton
    expect(screen.getByRole('button', { name: /Computing peer distribution\.\.\./i })).toBeDefined();
    expect(screen.getByRole('status')).toBeDefined();
  });

  it('3. In demo mode after 1.5s: renders complete Standout card with signature, standouts, worth weighing, and seller toggle', () => {
    render(<StandoutAIAnalysis propertyId={1} city="Hyderabad" />);

    const button = screen.getByRole('button', { name: /What stands out/i });
    fireEvent.click(button);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Signature line is present
    expect(screen.getByText(/Distinctive signature/i)).toBeDefined();
    expect(screen.getByText(/Ranked against 6 active projects in Hyderabad/i)).toBeDefined();

    // Standout metrics (up to 3)
    expect(screen.getByText(/STANDOUT METRICS/i)).toBeDefined();
    expect(screen.getByText('Each passenger lift serves 78 homes across 24 floors')).toBeDefined();
    expect(screen.getByText('1 of 7 projects in Hyderabad')).toBeDefined();

    // Worth weighing section
    expect(screen.getByText(/WORTH WEIGHING/i)).toBeDefined();
    expect(screen.getByText('Single-level underground parking would consume 63% of the entire site area')).toBeDefined();

    // Questions for builder
    expect(screen.getByText(/QUESTIONS FOR THE BUILDER/i)).toBeDefined();

    // Footer
    expect(screen.getByText(/Cohort: 6 peers in Hyderabad/i)).toBeDefined();

    // Seller view toggle works
    const sellerBtn = screen.getByRole('button', { name: /Seller view: Data that would strengthen this analysis/i });
    expect(sellerBtn).toBeDefined();

    fireEvent.click(sellerBtn);
    expect(screen.getByText(/Missing specifications that blocked an extreme stand-out/i)).toBeDefined();
    expect(screen.getByText(/Tower footprints and coordinates/i)).toBeDefined();

    // Toggle collapse
    const hideBtn = screen.getByRole('button', { name: /Hide standouts/i });
    fireEvent.click(hideBtn);
    expect(screen.queryByText(/Distinctive signature/i)).toBeNull();
  });
});
