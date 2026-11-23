import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AdvisorReadCard } from '../components/intelligence/AdvisorReadCard';

describe('AdvisorReadCard Component', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_AI_ANALYSIS_MODE', 'demo');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('1. Idle state on load: button visible, never open on load, aria-busy false', () => {
    render(<AdvisorReadCard propertyId={1} />);

    const button = screen.getByRole('button', { name: /Advisor's read/i });
    expect(button).toBeDefined();
    expect(button.getAttribute('aria-busy')).toBe('false');
    expect(button.getAttribute('aria-expanded')).toBe('false');

    // No card content visible on load
    expect(screen.queryByText(/Project Assessment & Advisory Perspective/i)).toBeNull();
    expect(screen.queryByText(/WHAT MATTERS MOST/i)).toBeNull();
  });

  it('2. Clicking button transitions to loading state with aria-busy=true', () => {
    render(<AdvisorReadCard propertyId={1} />);

    const button = screen.getByRole('button', { name: /Advisor's read/i });
    fireEvent.click(button);

    expect(screen.getByRole('button', { name: /Analyzing outside evidence\.\.\./i })).toBeDefined();
    expect(button.getAttribute('aria-busy')).toBe('true');
  });

  it('3. Renders complete Advisor Read with signature, top 3 matters most, tension, settle first, and evidence panel', () => {
    render(<AdvisorReadCard propertyId={1} />);

    const button = screen.getByRole('button', { name: /Advisor's read/i });
    fireEvent.click(button);

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    // Heading and Signature line
    expect(screen.getByText(/Project Assessment & Advisory Perspective/i)).toBeDefined();
    expect(screen.getByText(/Ranked across 7 active projects in Hyderabad/i)).toBeDefined();

    // Top 3 What Matters Most
    expect(screen.getByText(/WHAT MATTERS MOST/i)).toBeDefined();
    expect(screen.getByText(/ORR Feeder Boulevard lies within 140 m of the northern boundary/i)).toBeDefined();
    expect(screen.getByText(/Each passenger lift serves 78 homes, ranking 1 of 7 projects in Hyderabad/i)).toBeDefined();
    expect(screen.getByText(/69% of the purchased footprint is private carpet area/i)).toBeDefined();

    // Source chips with family labels
    expect(screen.getAllByText('World').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Market').length).toBeGreaterThan(0);

    // Tension and Settle first
    expect(screen.getByText(/THE TENSION/i)).toBeDefined();
    expect(screen.getByText(/On one hand, each passenger lift serves 78 homes/i)).toBeDefined();
    expect(screen.getByText(/SETTLE THIS FIRST/i)).toBeDefined();
    expect(screen.getByText(/Confirm the registered RERA completion date/i)).toBeDefined();

    // Checks you can make now
    expect(screen.getByText(/CHECKS YOU CAN MAKE NOW/i)).toBeDefined();
    expect(screen.getByText(/Audit the physical 140 m setback/i)).toBeDefined();

    // Evidence panel must show "Record: not checked"
    expect(screen.getByText(/WHERE THIS COMES FROM/i)).toBeDefined();
    expect(screen.getByText(/Record: not checked/i)).toBeDefined();

    // Footer disclaimer
    expect(screen.getByText(/Decision support from listed data, public data and your inputs/i)).toBeDefined();
  });

  it('4. Selecting a priority chip switches to "For you" mode and updates findings', () => {
    render(<AdvisorReadCard propertyId={1} />);

    const button = screen.getByRole('button', { name: /Advisor's read/i });
    fireEvent.click(button);

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    // Click priority chip "Commute time"
    const commuteChip = screen.getByRole('button', { name: /Commute time/i });
    fireEvent.click(commuteChip);

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    // "For you" finding is now in top 3
    expect(screen.getByText(/Annual commute to Oakridge International totals 160.0 hours/i)).toBeDefined();
    expect(screen.getByText(/For a household with a school run twice a day/i)).toBeDefined();
  });
});
