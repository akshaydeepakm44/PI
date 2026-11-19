import { describe, it, expect } from 'vitest';
import {
  getInitialDemoMessages,
  simulateAssistantResponse,
  SUGGESTED_QUESTIONS
} from '../services/mockAssistantSimulator';
import { simulateGlobalAssistantResponse } from '../services/preferenceAssistantSimulator';
import { Property } from '../types';

const mockProperty: Property = {
  id: 101,
  seller_id: 1,
  name: 'Ocean Vista Heights',
  property_type: 'apartment',
  state: 'Andhra Pradesh',
  district: 'Visakhapatnam',
  city: 'Visakhapatnam',
  locality: 'Rushikonda',
  address: 'Beach Road, Rushikonda, Visakhapatnam',
  latitude: 17.7834,
  longitude: 83.3854,
  area: 1650,
  area_unit: 'sq. ft.',
  asking_price: '₹1.15 Cr',
  price_unit: 'INR',
  rate_per_sqft: 6970,
  availability_date: 'Ready to Move',
  description: 'Premium sea-facing apartment.',
  amenities: ['Swimming Pool', 'Clubhouse', 'Gymnasium', 'Covered Parking'],
  utilities: ['Municipal Water', '3-Phase Power'],
  construction_status: 'Ready to Move',
  photos: [{ url: '/assets/ramez_seapoint.jpg' }],
  documents: [{ name: 'Sanctioned_Plan.pdf', url: '/docs/plan.pdf' }],
  seller_name: 'Coastal Infra Developers',
  seller_contact: '+91 98765 43210',
  possession_date: 'Immediate',
  verification_status: 'unverified',
  status: 'published',
  is_demo: true,
  views_count: 42,
  created_at: '2026-01-01',
  updated_at: '2026-01-01'
};

describe('Mock AI Assistant Simulator', () => {
  it('provides pre-loaded sample conversation for client presentation', () => {
    const initialMessages = getInitialDemoMessages(mockProperty);
    expect(initialMessages.length).toBeGreaterThanOrEqual(4);
    expect(initialMessages[0].sender).toBe('assistant');
    expect(initialMessages[1].sender).toBe('buyer');
    expect(initialMessages[2].sender).toBe('assistant');
    expect(initialMessages[2].sources).toContain('Property listing');
  });

  it('contains all 8 recommended suggested questions', () => {
    expect(SUGGESTED_QUESTIONS.length).toBe(8);
    expect(SUGGESTED_QUESTIONS).toContain('What are the key details of this property?');
    expect(SUGGESTED_QUESTIONS).toContain('What amenities are available?');
    expect(SUGGESTED_QUESTIONS).toContain('What schools and hospitals are nearby?');
    expect(SUGGESTED_QUESTIONS).toContain('What are the main advantages and limitations?');
    expect(SUGGESTED_QUESTIONS).toContain('What additional costs should I consider?');
    expect(SUGGESTED_QUESTIONS).toContain('What information is still missing?');
    expect(SUGGESTED_QUESTIONS).toContain('What questions should I ask the seller?');
    expect(SUGGESTED_QUESTIONS).toContain('How does this property fit my preferences?');
  });

  it('accurately answers key details with property specs', async () => {
    const res = await simulateAssistantResponse('What are the key details of this property?', mockProperty);
    expect(res.sender).toBe('assistant');
    expect(res.text).toContain('Ocean Vista Heights');
    expect(res.text).toContain('apartment');
    expect(res.text).toContain('1,650 sq. ft.');
    expect(res.sources).toContain('Property listing');
    expect(res.notVerifiedNotice).toBe(true);
  });

  it('accurately answers amenities query with listed amenities', async () => {
    const res = await simulateAssistantResponse('What amenities are available?', mockProperty);
    expect(res.text).toContain('Swimming Pool');
    expect(res.text).toContain('Clubhouse');
    expect(res.sources).toContain('Seller-provided information');
  });

  it('returns appropriate guidance for additional costs', async () => {
    const res = await simulateAssistantResponse('What additional costs should I consider?', mockProperty);
    expect(res.text).toContain('registration charges');
    expect(res.sources).toContain('Sample calculation');
    expect(res.sources).toContain('Information unavailable');
  });

  it('returns missing information checklist', async () => {
    const res = await simulateAssistantResponse('What information is still missing?', mockProperty);
    expect(res.text).toContain('complete cost breakdown');
    expect(res.sources).toContain('Information unavailable');
  });

  it('returns questions for the seller', async () => {
    const res = await simulateAssistantResponse('What questions should I ask the seller?', mockProperty);
    expect(res.text).toContain('sanctioned building plan');
    expect(res.sources).toContain('Property listing');
  });

  it('provides a graceful fallback for unhandled questions', async () => {
    const res = await simulateAssistantResponse('Can you predict property price in 2035?', mockProperty);
    expect(res.text).toContain('simulated assistant can only demonstrate sample property information');
    expect(res.sources).toContain('Information unavailable');
  });
});

describe('Global Preference Assistant Simulator', () => {
  it('correctly parses user preference for 3 BHK flats and returns recommendations', async () => {
    const res = await simulateGlobalAssistantResponse("i'm searching fro 3bhk flats", [mockProperty]);
    expect(res.sender).toBe('assistant');
    expect(res.text).toContain('3 BHK');
    expect(res.recommendations).toBeDefined();
    expect(res.recommendations!.length).toBeGreaterThan(0);
  });

  it('correctly parses 2 BHK query', async () => {
    const res = await simulateGlobalAssistantResponse('2bhk', [mockProperty]);
    expect(res.text).toContain('2 BHK');
    expect(res.recommendations).toBeDefined();
  });

  it('handles villa preference search', async () => {
    const res = await simulateGlobalAssistantResponse('looking for villas with garden', [mockProperty]);
    expect(res.text).toContain('villa');
    expect(res.recommendations).toBeDefined();
  });

  it('answers simple questions about additional buying costs', async () => {
    const res = await simulateGlobalAssistantResponse('what are the extra costs to buy?');
    expect(res.text).toContain('Stamp Duty');
    expect(res.sources).toContain('Sample calculation');
  });
});

