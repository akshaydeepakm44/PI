import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SectionAIAnalysis } from '../components/intelligence/SectionAIAnalysis';
import { SAMPLE_ANALYSES } from '../demo/sampleAnalyses';

describe('SectionAIAnalysis Component', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_AI_ANALYSIS_MODE', 'demo');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('1. Idle state on load: button visible, helper text visible, NO card, skeleton or spinner', () => {
    render(<SectionAIAnalysis propertyId={1} sectionId="neighbourhood" />);

    // Button and helper text are rendered
    const button = screen.getByRole('button', { name: /AI analysis/i });
    expect(button).toBeDefined();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-busy')).toBe('false');
    expect(screen.getByText('Get an analysis of this section')).toBeDefined();

    // No card, skeleton, or sample analysis badge exists in the DOM
    expect(screen.queryByText(/Agent briefing/i)).toBeNull();
    expect(screen.queryByText(/Sample analysis/i)).toBeNull();
    expect(screen.queryByText(/Analysing\.\.\./i)).toBeNull();
  });

  it('2. Clicking button transitions to loading state with aria-busy, disabled button, and skeleton', () => {
    render(<SectionAIAnalysis propertyId={1} sectionId="commute" />);

    const button = screen.getByRole('button', { name: /AI analysis/i });
    fireEvent.click(button);

    // Button is disabled and shows Analysing...
    const loadingBtn = screen.getByRole('button', { name: /Analysing\.\.\./i });
    expect(loadingBtn).toBeDefined();
    expect(loadingBtn.getAttribute('disabled')).not.toBeNull();
    expect(loadingBtn.getAttribute('aria-busy')).toBe('true');

    // Skeleton and polite status announcement are present
    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.getByText('Analysing this section')).toBeDefined();
  });

  it('3. In demo mode after 1.5s: renders Sample analysis card with mandatory badge and footer', () => {
    render(<SectionAIAnalysis propertyId={1} sectionId="units" />);

    const button = screen.getByRole('button', { name: /AI analysis/i });
    fireEvent.click(button);

    // Advance 1500ms
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Mandatory badge and title
    expect(screen.getByText('Sample analysis')).toBeDefined();
    expect(screen.getByText('Agent briefing · Unit plans & pricing')).toBeDefined();

    // Briefing text present
    expect(screen.getByText(/The ₹1.12 Cr 2 BHK is really/i)).toBeDefined();

    // Worth knowing findings rendered
    expect(screen.getByText('Only 69% of what you pay for is floor inside the walls')).toBeDefined();
    expect(screen.getByText(/8,615 per sq ft on the brochure/i)).toBeDefined();
    expect(screen.getByText(/the builder quotes the price on a different area basis/i)).toBeDefined();

    // Mandatory demo footer present
    expect(
      screen.getByText(/Sample content shown to demonstrate how analysis will appear\. Not a verified analysis of this property\./i)
    ).toBeDefined();

    // "Ask a follow-up" is strictly hidden in demo mode
    expect(screen.queryByRole('button', { name: /Ask a follow-up/i })).toBeNull();

    // Button changes to "Hide analysis" with aria-expanded="true"
    const hideBtn = screen.getByRole('button', { name: /Hide analysis/i });
    expect(hideBtn).toBeDefined();
    expect(hideBtn.getAttribute('aria-expanded')).toBe('true');

    // "Run again" action is available
    expect(screen.getByRole('button', { name: /Run again/i })).toBeDefined();
  });

  it('4. Clicking "Hide analysis" collapses card, clicking again restores it', () => {
    render(<SectionAIAnalysis propertyId={1} sectionId="master-plan" />);

    const button = screen.getByRole('button', { name: /AI analysis/i });
    fireEvent.click(button);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByText('Sample analysis')).toBeDefined();

    // Click Hide analysis
    const hideBtn = screen.getByRole('button', { name: /Hide analysis/i });
    fireEvent.click(hideBtn);

    // Card is collapsed (not visible)
    expect(screen.queryByText('Sample analysis')).toBeNull();

    // Click AI analysis again to re-expand
    const reOpenBtn = screen.getByRole('button', { name: /AI analysis/i });
    fireEvent.click(reOpenBtn);

    expect(screen.getByText('Sample analysis')).toBeDefined();
  });

  it('5. All 9 sample analyses exist and have required structure', () => {
    const requiredSections = [
      'neighbourhood',
      'liveability',
      'commute',
      'master-plan',
      'towers',
      'units',
      'amenities',
      'sustainability',
      'safety'
    ];

    for (const sec of requiredSections) {
      const data = SAMPLE_ANALYSES[sec];
      expect(data).toBeDefined();
      expect(data.briefing.length).toBeGreaterThan(20);
      expect(data.findings.length).toBeGreaterThanOrEqual(2);
      expect(data.questions.length).toBeGreaterThanOrEqual(2);
      expect(data.explainer.formulas.length).toBeGreaterThan(0);
      expect(data.explainer.assumptions.length).toBeGreaterThan(0);
      expect(data.visual).toBeDefined();
    }
  });
});
