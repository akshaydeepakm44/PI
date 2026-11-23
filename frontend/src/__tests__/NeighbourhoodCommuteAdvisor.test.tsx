import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SectionAIAnalysis } from '../components/intelligence/SectionAIAnalysis';
import { SAMPLE_ANALYSES } from '../demo/sampleAnalyses';

describe('Neighbourhood & Commute Advisor Style Sample Analyses', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_AI_ANALYSIS_MODE', 'demo');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('1. Verifies removed sentences do not exist in demo files', () => {
    const removedPhrases = [
      'Groceries are the closest daily need at 1.2 km',
      'From this project it is 22 minutes each way to DLF Cyber City',
      'The school is nearly three times as far as the supermarket'
    ];

    const jsonString = JSON.stringify(SAMPLE_ANALYSES);
    for (const phrase of removedPhrases) {
      expect(jsonString).not.toContain(phrase);
    }
  });

  it('2. Neighbourhood: click-to-run renders advisor style result with tension, settle first, checks, and banner', () => {
    render(<SectionAIAnalysis propertyId={1} sectionId="neighbourhood" />);

    // Click AI analysis button
    const btn = screen.getByRole('button', { name: /AI analysis/i });
    fireEvent.click(btn);

    // Fast-forward demo delay
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Sample analysis badge and top sample banner
    expect(screen.getByText('Sample analysis')).toBeDefined();
    const banners = screen.getAllByText(/Sample data\. Not the real surroundings, peers or traffic of this project\./i);
    expect(banners.length).toBeGreaterThanOrEqual(1);

    // Headline briefing and findings
    expect(screen.getByText(/This is a drive-first location with a walkable errand core/i)).toBeDefined();
    expect(screen.getByText('The metro is 4.7 km by road, not 3 km.')).toBeDefined();
    expect(screen.getByText('Errands are close; emergency care is not.')).toBeDefined();
    expect(screen.getByText('Services lie in two directions.')).toBeDefined();

    // Source chips by family
    expect(screen.getByText(/Builder \(listed 3 km\) · Nov 2026/i)).toBeDefined();
    expect(screen.getByText(/Map \(road route\) · Nov 2026/i)).toBeDefined();

    // Tension and Settle first
    expect(screen.getByText(/The Tension/i)).toBeDefined();
    expect(screen.getByText(/On one hand the errand core is strong/i)).toBeDefined();
    expect(screen.getByText(/Settle This First/i)).toBeDefined();
    expect(screen.getByText(/Ask whether the listed 3 km is road or straight-line/i)).toBeDefined();

    // Checks you can make now
    expect(screen.getByText(/Checks You Can Make Now/i)).toBeDefined();
    expect(screen.getByText(/Trace the road route to the metro on the map/i)).toBeDefined();

    // Visual: Detour comparison bars & 10-minute walk errand core
    expect(screen.getByText('Listed vs by road')).toBeDefined();
    expect(screen.getByText(/x1\.57 detour/i)).toBeDefined();
    expect(screen.getAllByText(/10-minute walk/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/3 grocery/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/1 pharmacy/i).length).toBeGreaterThanOrEqual(1);

    // Footer
    expect(screen.getAllByText(/Sample map data, Nov 2026\. Peer set: 14 projects within 5 km/i).length).toBeGreaterThanOrEqual(1);
  });

  it('3. My Commute: renders profile chips, time toggle (08:30/11:00/18:30), transit stacked bar, and add commute', () => {
    render(<SectionAIAnalysis propertyId={1} sectionId="commute" />);

    const btn = screen.getByRole('button', { name: /AI analysis/i });
    fireEvent.click(btn);

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Profile chip header
    expect(screen.getByText(/For you: 1 child in school · Office: DLF Cyber City · Priority: commute time/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Edit/i })).toBeDefined();

    // Headline briefing and findings with "For you" line
    expect(screen.getByText(/For a household with an office at DLF Cyber City and one child at Oakridge/i)).toBeDefined();
    expect(screen.getByText('Your two daily trips cost about 357 hours a year.')).toBeDefined();
    expect(screen.getByText(/With one child at Oakridge, the school run is nearly as large as the office commute\./i)).toBeDefined();
    expect(screen.getByText('The 08:30 departure adds about 38 hours a year.')).toBeDefined();
    expect(screen.getByText('Cycling to the office takes 36 minutes against 22 by car.')).toBeDefined();

    // The tension & Settle first
    expect(screen.getByText(/The Tension/i)).toBeDefined();
    expect(screen.getByText(/On one hand both daily destinations are close/i)).toBeDefined();
    expect(screen.getByText(/Settle This First/i)).toBeDefined();
    expect(screen.getByText(/Check the 08:30 trip time on a weekday morning/i)).toBeDefined();

    // Time toggle updates route times
    const btn1100 = screen.getByRole('button', { name: /11:00/i });
    expect(btn1100).toBeDefined();

    // Initially at 08:30: DLF Cyber City takes 31 mins
    expect(screen.getByText('31 mins')).toBeDefined();

    // Switch time toggle to 11:00
    fireEvent.click(btn1100);
    expect(screen.getByText('22 mins')).toBeDefined();

    // Transit stacked bar present
    expect(screen.getByText('Your year in transit')).toBeDefined();
    expect(screen.getByText(/Office: 183 h/i)).toBeDefined();
    expect(screen.getByText(/School: 173 h/i)).toBeDefined();
    expect(screen.getByText(/\+38 h Peak/i)).toBeDefined();

    // Add commute destination button present
    const addCommuteBtn = screen.getByRole('button', { name: /Add a commute destination/i });
    expect(addCommuteBtn).toBeDefined();

    // Footer
    expect(screen.getAllByText(/Sample traffic and map data, Nov 2026/i).length).toBeGreaterThanOrEqual(1);
  });
});
