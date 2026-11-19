import { Property } from '../types';

export interface AssistantRecommendation {
  id: number;
  name: string;
  property_type: string;
  locality: string;
  city: string;
  asking_price: string;
  area: string;
  bhk?: string;
  image: string;
  highlights: string[];
}

export interface GlobalChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  recommendations?: AssistantRecommendation[];
  sources?: string[];
  suggestedFollowUps?: string[];
}

export const GLOBAL_SUGGESTED_CHIPS = [
  '🏢 3 BHK Flats',
  '🏡 2 BHK under ₹80 L',
  '🌊 Sea-facing in Rushikonda',
  '🔑 Ready to move',
  '💰 Additional buying costs',
  '📋 Due diligence checklist'
];

// Fallback showcase property data in case query returned empty
export const SAMPLE_DIRECTORY_PROPERTIES: AssistantRecommendation[] = [
  {
    id: 1,
    name: 'Ramez Seapoint',
    property_type: 'Apartment',
    locality: 'Madhurawada',
    city: 'Visakhapatnam',
    asking_price: '₹75 L - 1.2 Cr',
    area: '1,350 - 2,450 sq ft',
    bhk: '2 & 3 BHK',
    image: '/assets/ramez_seapoint.jpg',
    highlights: ['Sea-facing balconies', 'Swimming pool & Gym', '3.2 km to Rushikonda Beach']
  },
  {
    id: 2,
    name: 'Sreeja Ocean View',
    property_type: 'Apartment',
    locality: 'Rushikonda',
    city: 'Visakhapatnam',
    asking_price: '₹68 L - 1.1 Cr',
    area: '1,200 - 2,100 sq ft',
    bhk: '2 & 3 BHK',
    image: '/assets/ramez_seapoint.jpg',
    highlights: ['Unobstructed ocean views', 'Ready to Move', 'Immediate IT SEZ access']
  },
  {
    id: 3,
    name: 'Greenfield Palm Villas',
    property_type: 'Villa',
    locality: 'Bhimili Corridor',
    city: 'Visakhapatnam',
    asking_price: '₹1.45 Cr - 2.1 Cr',
    area: '2,800 - 3,600 sq ft',
    bhk: '3 & 4 BHK Villa',
    image: '/assets/ramez_seapoint.jpg',
    highlights: ['Private garden & terrace', 'Gated community security', 'Solar grid enabled']
  },
  {
    id: 4,
    name: 'Haritha Sky Greens',
    property_type: 'Apartment',
    locality: 'Yendada',
    city: 'Visakhapatnam',
    asking_price: '₹55 L - 85 L',
    area: '1,100 - 1,750 sq ft',
    bhk: '2 & 3 BHK',
    image: '/assets/ramez_seapoint.jpg',
    highlights: ['Affordable pricing', 'Near NH16 Highway', 'Rainwater harvesting']
  },
  {
    id: 5,
    name: 'Panorama Grand Residencies',
    property_type: 'Apartment',
    locality: 'MVP Colony',
    city: 'Visakhapatnam',
    asking_price: '₹1.1 Cr - 1.8 Cr',
    area: '1,800 - 2,600 sq ft',
    bhk: '3 & 4 BHK',
    image: '/assets/ramez_seapoint.jpg',
    highlights: ['Prime central locality', 'Walkable to hospitals & schools', 'Covered double parking']
  }
];

export function getGlobalInitialMessages(): GlobalChatMessage[] {
  return [
    {
      id: 'g-msg-1',
      sender: 'assistant',
      text: `Hello! 👋 I am your **AI Property Assistant** for the HI IN Directory.\n\nTell me what kind of property you are looking for—such as **"I'm searching for 3 BHK flats"**, **"2 BHK in Madhurawada"**, or **"Villas under ₹1.5 Cr"**—or ask any questions about amenities, pricing, or due diligence.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: ['HI IN Property Directory', 'Location Research'],
      suggestedFollowUps: ['3 BHK Flats', '2 BHK under ₹80 L', 'Near Beach Road']
    }
  ];
}

/**
 * Intelligent preference parser and recommendation engine.
 * Matches user criteria against available property inventory.
 */
export async function simulateGlobalAssistantResponse(
  query: string,
  allProperties?: Property[] | null,
  activeProperty?: Property | null
): Promise<GlobalChatMessage> {
  // Paced realistic delay (600ms - 900ms)
  await new Promise((resolve) => setTimeout(resolve, 750));

  const q = query.toLowerCase().trim();
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Map backend Property objects to recommendations format if available
  const pool: AssistantRecommendation[] = allProperties && allProperties.length > 0
    ? allProperties.map((p) => {
        const bhkGuess = p.name.includes('3') ? '3 BHK' : p.name.includes('2') ? '2 BHK' : p.area > 1800 ? '3 & 4 BHK' : '2 & 3 BHK';
        return {
          id: p.id,
          name: p.name,
          property_type: p.property_type ? p.property_type.replace('_', ' ') : 'Apartment',
          locality: p.locality || 'Visakhapatnam',
          city: p.city || 'Visakhapatnam',
          asking_price: p.asking_price || '₹75 Lakh',
          area: `${p.area} ${p.area_unit || 'sq ft'}`,
          bhk: bhkGuess,
          image: p.photos?.[0]?.url || '/assets/ramez_seapoint.jpg',
          highlights: p.amenities?.slice(0, 3) || ['Verified road access', '24/7 Security', 'Covered Parking']
        };
      })
    : SAMPLE_DIRECTORY_PROPERTIES;

  // 1. 3 BHK / 3-bedroom query
  if (q.includes('3bhk') || q.includes('3 bhk') || q.includes('3 bedroom') || q.includes('3-bedroom') || q.includes('three bedroom')) {
    const matched = pool.filter(
      (p) =>
        p.bhk?.includes('3') ||
        p.name.toLowerCase().includes('seapoint') ||
        p.name.toLowerCase().includes('ocean') ||
        p.name.toLowerCase().includes('grand') ||
        p.name.toLowerCase().includes('palm')
    ).slice(0, 3);

    return {
      id: `g-res-${Date.now()}`,
      sender: 'assistant',
      text: `I found **${matched.length} verified listings** matching your requirement for **3 BHK flats / apartments** in Visakhapatnam.\n\nHere are prime options currently active in the directory:`,
      timestamp: time,
      recommendations: matched.length > 0 ? matched : pool.slice(0, 2),
      sources: ['Property Directory', 'Seller-provided specs'],
      suggestedFollowUps: ['Show price breakdown', 'Which ones are near schools?', 'Compare these options']
    };
  }

  // 2. 2 BHK / 2-bedroom query
  if (q.includes('2bhk') || q.includes('2 bhk') || q.includes('2 bedroom') || q.includes('2-bedroom') || q.includes('two bedroom')) {
    const matched = pool.filter(
      (p) =>
        p.bhk?.includes('2') ||
        p.name.toLowerCase().includes('seapoint') ||
        p.name.toLowerCase().includes('ocean') ||
        p.name.toLowerCase().includes('green')
    ).slice(0, 3);

    return {
      id: `g-res-${Date.now()}`,
      sender: 'assistant',
      text: `Here are **${matched.length} popular 2 BHK apartments** suited for compact family living with lower maintenance overhead:`,
      timestamp: time,
      recommendations: matched.length > 0 ? matched : pool.slice(0, 2),
      sources: ['Property Directory', 'Seller listing'],
      suggestedFollowUps: ['2 BHK under ₹80 L', 'Are these ready to move?', 'Check commute times']
    };
  }

  // 3. Villas / Independent Houses
  if (q.includes('villa') || q.includes('bungalow') || q.includes('independent house') || q.includes('gated community villa')) {
    const matched = pool.filter(
      (p) =>
        p.property_type.toLowerCase().includes('villa') ||
        p.name.toLowerCase().includes('villa') ||
        p.name.toLowerCase().includes('palm')
    );

    return {
      id: `g-res-${Date.now()}`,
      sender: 'assistant',
      text: `Looking for independent villa living? Here are premium **villa properties** with dedicated plot land and private terraces:`,
      timestamp: time,
      recommendations: matched.length > 0 ? matched : [SAMPLE_DIRECTORY_PROPERTIES[2]],
      sources: ['Property Directory', 'Physical Specifications'],
      suggestedFollowUps: ['What is the plot frontage?', 'Water supply arrangements', 'Schedule site visit']
    };
  }

  // 4. Budget-specific queries (e.g. Under 1 Cr / Under 80 Lakh / Affordable)
  if (q.includes('under') || q.includes('budget') || q.includes('cheap') || q.includes('affordable') || q.includes('crore') || q.includes('lakh') || q.includes('cr')) {
    const matched = pool.filter(
      (p) =>
        p.asking_price.includes('55 L') ||
        p.asking_price.includes('68 L') ||
        p.asking_price.includes('75 L') ||
        p.asking_price.includes('85 L') ||
        p.asking_price.includes('1.1 Cr')
    ).slice(0, 3);

    return {
      id: `g-res-${Date.now()}`,
      sender: 'assistant',
      text: `Here are properties that offer competitive value in the **mid-market segment** (under ₹1.1 Cr) across prime growth corridors:`,
      timestamp: time,
      recommendations: matched.length > 0 ? matched : pool.slice(0, 2),
      sources: ['Sample calculation', 'Property listing'],
      suggestedFollowUps: ['What additional costs apply?', 'Are home loans approved?', 'Show RERA details']
    };
  }

  // 5. Locality queries (e.g. Rushikonda, Madhurawada, MVP Colony, Beach Road)
  if (q.includes('rushikonda') || q.includes('madhurawada') || q.includes('mvp') || q.includes('beach') || q.includes('bhimili') || q.includes('yendada')) {
    const targetLoc = q.includes('rushikonda')
      ? 'Rushikonda'
      : q.includes('madhurawada')
      ? 'Madhurawada'
      : q.includes('mvp')
      ? 'MVP Colony'
      : q.includes('yendada')
      ? 'Yendada'
      : 'Bhimili Corridor';

    const matched = pool.filter((p) => p.locality.toLowerCase().includes(targetLoc.toLowerCase()) || p.name.toLowerCase().includes(targetLoc.toLowerCase())).slice(0, 3);

    return {
      id: `g-res-${Date.now()}`,
      sender: 'assistant',
      text: `Here are listings situated in and around **${targetLoc}**, featuring direct access to key transit corridors and commercial centers:`,
      timestamp: time,
      recommendations: matched.length > 0 ? matched : pool.slice(0, 2),
      sources: ['Location research', 'OpenStreetMap POI graph'],
      suggestedFollowUps: ['Air quality in this area', 'Nearest hospitals and schools', 'Road connectivity']
    };
  }

  // 6. Amenities queries (e.g. Swimming pool, Gym, Sea view)
  if (q.includes('pool') || q.includes('gym') || q.includes('sea view') || q.includes('sea facing') || q.includes('garden')) {
    const matched = pool.filter(
      (p) =>
        p.highlights.some((h) => h.toLowerCase().includes('sea') || h.toLowerCase().includes('pool') || h.toLowerCase().includes('gym')) ||
        p.name.toLowerCase().includes('seapoint') ||
        p.name.toLowerCase().includes('ocean')
    ).slice(0, 3);

    return {
      id: `g-res-${Date.now()}`,
      sender: 'assistant',
      text: `Here are properties that highlight premium amenities including **sea-facing views, swimming pools, and dedicated fitness centers**:`,
      timestamp: time,
      recommendations: matched.length > 0 ? matched : pool.slice(0, 2),
      sources: ['Seller-provided information', 'Property listing'],
      suggestedFollowUps: ['Maintenance charges for club', 'Power backup capacity', 'Parking availability']
    };
  }

  // 7. General Questions: Additional costs
  if (q.includes('cost') || q.includes('tax') || q.includes('registration') || q.includes('fee')) {
    return {
      id: `g-res-${Date.now()}`,
      sender: 'assistant',
      text: `When budgeting for a property purchase in Visakhapatnam, factor in these mandatory and recurring costs beyond the base asking price:\n\n• **Stamp Duty & Registration**: Approximately 5% to 7.5% of market value\n• **GST**: 5% on under-construction non-affordable apartments (0% on completed with OC)\n• **Society Sinking Fund**: Initial deposit of ₹50,000 to ₹1,50,000\n• **Covered Car Parking**: ₹2 Lakh to ₹4 Lakh if not bundled\n• **Clubhouse & Electrification**: ₹1.5 Lakh to ₹3 Lakh\n\nAlways ask the developer for an itemized **"All-Inclusive Cost Sheet"**.`,
      timestamp: time,
      sources: ['Sample calculation', 'Market standard'],
      suggestedFollowUps: ['How to ask developer for cost sheet', 'Properties with OC ready']
    };
  }

  // 8. General Questions: Due Diligence / RERA
  if (q.includes('rera') || q.includes('legal') || q.includes('document') || q.includes('verify') || q.includes('checklist')) {
    return {
      id: `g-res-${Date.now()}`,
      sender: 'assistant',
      text: `Essential due-diligence checklist before committing to a property:\n\n1. **AP RERA Verification**: Verify the registration number on the official AP RERA portal.\n2. **Sanctioned Plans**: Ensure the floor plan matches the VMRDA/GVMC municipal sanction.\n3. **Title Search Report**: Review 30-year non-encumbrance certificate (Form 15).\n4. **Occupancy Certificate (OC)**: Mandatory before taking physical possession of completed units.\n5. **Bank Approvals**: Check if leading public/private banks have approved the project for home loans.`,
      timestamp: time,
      sources: ['Legal due diligence guidelines', 'VMRDA / AP RERA'],
      suggestedFollowUps: ['Show RERA registered properties', 'Questions to ask the seller']
    };
  }

  // 9. Simple Greeting / Fallback
  return {
    id: `g-res-${Date.now()}`,
    sender: 'assistant',
    text: `I can help you discover properties across Visakhapatnam and answer questions about specifications, legal checklists, or pricing.\n\nTry asking me:\n• *"I'm searching for 3 BHK flats"*\n• *"Show 2 BHK apartments in Madhurawada"*\n• *"Villas under ₹1.5 Cr"*\n• *"What additional costs should I consider?"*`,
    timestamp: time,
    sources: ['HI IN Assistant'],
    suggestedFollowUps: ['3 BHK Flats', '2 BHK Apartments', 'Villas']
  };
}
