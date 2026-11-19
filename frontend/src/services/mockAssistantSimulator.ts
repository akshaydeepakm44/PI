import { Property, BuyerPreferences } from '../types';

export type EvidenceSourceType =
  | 'Seller-provided information'
  | 'Property listing'
  | 'Location research'
  | 'Sample calculation'
  | 'Information unavailable';

export interface ChatMessage {
  id: string;
  sender: 'buyer' | 'assistant';
  text: string;
  timestamp: string;
  sources?: EvidenceSourceType[];
  notVerifiedNotice?: boolean;
}

export const SUGGESTED_QUESTIONS = [
  'What are the key details of this property?',
  'What amenities are available?',
  'What schools and hospitals are nearby?',
  'What are the main advantages and limitations?',
  'What additional costs should I consider?',
  'What information is still missing?',
  'What questions should I ask the seller?',
  'How does this property fit my preferences?'
];

// Helper to format timestamps consistently
export function getCurrentTimeFormatted(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Generate pre-loaded demo conversation
export function getInitialDemoMessages(property?: Property | null): ChatMessage[] {
  const propName = property?.name || 'Sea Breeze Tower Apartment';
  const propType = property?.property_type ? property.property_type.replace('_', ' ') : '3-bedroom apartment';
  const propArea = property?.area ? `${property.area.toLocaleString()} ${property.area_unit || 'sq. ft.'}` : '1,450 sq. ft.';
  const propPrice = property?.asking_price || '₹85 lakh';

  return [
    {
      id: 'msg-init-1',
      sender: 'assistant',
      text: `Hello! I am your **AI Property Assistant** for **${propName}**.\n\nI can help summarize listing details, evaluate nearby amenities and road connectivity, highlight missing documentation, and estimate potential acquisition charges based on available evidence. How can I assist your evaluation today?`,
      timestamp: '10:30 AM',
      sources: ['Property listing', 'Location research'],
      notVerifiedNotice: false
    },
    {
      id: 'msg-init-2',
      sender: 'buyer',
      text: 'What are the key details of this property?',
      timestamp: '10:31 AM'
    },
    {
      id: 'msg-init-3',
      sender: 'assistant',
      text: `This listing describes a **${propType}** with a stated area of **${propArea}** and an asking price of **${propPrice}**.\n\nThese details come directly from the property listing and have not been independently verified.`,
      timestamp: '10:31 AM',
      sources: ['Property listing', 'Seller-provided information'],
      notVerifiedNotice: true
    },
    {
      id: 'msg-init-4',
      sender: 'buyer',
      text: 'What additional costs should I consider?',
      timestamp: '10:32 AM'
    },
    {
      id: 'msg-init-5',
      sender: 'assistant',
      text: `Your total cost may include the asking price, registration charges, applicable taxes, maintenance deposits and other fees.\n\nThe exact amount depends on the transaction and applicable charges. These costs are not fully available in this sample listing.`,
      timestamp: '10:32 AM',
      sources: ['Sample calculation', 'Information unavailable'],
      notVerifiedNotice: true
    }
  ];
}

/**
 * Intelligent keyword-based response simulator tailored to the active property.
 * Works completely on the client side without calling any external AI APIs.
 */
export async function simulateAssistantResponse(
  question: string,
  property?: Property | null,
  preferences?: BuyerPreferences | null
): Promise<ChatMessage> {
  // Paced typing delay between 700ms and 1100ms for realistic presentation feel
  await new Promise((resolve) => setTimeout(resolve, 850));

  const q = question.toLowerCase().trim();
  const time = getCurrentTimeFormatted();

  const propName = property?.name || 'this property';
  const propType = property?.property_type ? property.property_type.replace('_', ' ') : 'apartment';
  const propArea = property?.area ? `${property.area.toLocaleString()} ${property.area_unit || 'sq. ft.'}` : '1,450 sq. ft.';
  const propPrice = property?.asking_price || '₹85 lakh';
  const propLocality = property?.locality || 'Visakhapatnam';
  const propRate = property?.rate_per_sqft ? `₹${property.rate_per_sqft.toLocaleString()}/sq.ft` : null;

  // 1. Key Details / Specifications
  if (
    q.includes('key detail') ||
    q.includes('overview') ||
    q.includes('specification') ||
    q.includes('asking price') ||
    q.includes('what is the price') ||
    q.includes('property size') ||
    q.includes('square feet') ||
    q.includes('sq ft') ||
    q.includes('built-up') ||
    q.includes('basic info')
  ) {
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `For **${propName}**, this listing describes a **${propType}** with a stated area of **${propArea}** and an asking price of **${propPrice}**${propRate ? ` (${propRate})` : ''}.\n\nThese details come from the property listing and have not been independently verified.`,
      timestamp: time,
      sources: ['Property listing', 'Seller-provided information'],
      notVerifiedNotice: true
    };
  }

  // 2. Additional Costs & Charges (Checked before general advantages to avoid matching 'consider')
  if (
    q.includes('additional cost') ||
    q.includes('extra cost') ||
    q.includes('hidden cost') ||
    q.includes('tax') ||
    q.includes('registration charge') ||
    q.includes('registration fee') ||
    q.includes('maintenance fee') ||
    q.includes('total cost') ||
    q.includes('other cost')
  ) {
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `Your total cost may include the asking price (**${propPrice}**), registration charges, applicable taxes, maintenance deposits and other fees.\n\nThe exact amount depends on the transaction and applicable charges. These costs are not fully available in this sample listing.`,
      timestamp: time,
      sources: ['Sample calculation', 'Information unavailable'],
      notVerifiedNotice: true
    };
  }

  // 3. Amenities & Utilities
  if (
    q.includes('amenit') ||
    q.includes('facilit') ||
    q.includes('gym') ||
    q.includes('parking') ||
    q.includes('pool') ||
    q.includes('power backup') ||
    q.includes('utilit')
  ) {
    const amenitiesList = property?.amenities && property.amenities.length > 0
      ? property.amenities.join(', ')
      : 'Covered Parking, 24/7 Security, Power Backup, Gym, Children Play Area, Landscaped Garden';
    
    const utilitiesList = property?.utilities && property.utilities.length > 0
      ? property.utilities.join(', ')
      : 'Municipal Water Connection, 3-Phase Electricity, Underground Drainage';

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `According to the listing for **${propName}**, the following amenities are claimed by the seller:\n\n• **Amenities**: ${amenitiesList}\n• **Utilities**: ${utilitiesList}\n\n*Note:* The operational status, maintenance charges, and individual utility metering arrangements are not independently verified in this listing. Consider verifying these items during an on-site physical inspection.`,
      timestamp: time,
      sources: ['Seller-provided information', 'Property listing'],
      notVerifiedNotice: true
    };
  }

  // 4. Schools, Hospitals & Nearby Facilities
  if (
    q.includes('school') ||
    q.includes('hospital') ||
    q.includes('nearby') ||
    q.includes('transit') ||
    q.includes('location') ||
    q.includes('commute') ||
    q.includes('distance') ||
    q.includes('clinic')
  ) {
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `Location research for **${propLocality}** indicates the following nearby essential services:\n\n• **Healthcare**: Local multi-specialty hospitals and clinics are accessible within an estimated **8 to 15-minute** drive.\n• **Education**: Reputed CBSE schools and degree colleges are located along the primary road network (**10 to 20 minutes**).\n• **Connectivity**: Direct access to arterial transit corridors connecting to commercial hubs.\n\n*Estimated drive times are derived from standard road network models and may vary based on peak traffic and road works.*`,
      timestamp: time,
      sources: ['Location research', 'Sample calculation'],
      notVerifiedNotice: true
    };
  }

  // 5. Advantages & Limitations (Pros & Cons)
  if (
    q.includes('advantage') ||
    q.includes('limitation') ||
    q.includes('pros') ||
    q.includes('cons') ||
    q.includes('pro and con') ||
    q.includes('drawback') ||
    q.includes('benefit') ||
    q.includes('strength') ||
    q.includes('weakness')
  ) {
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `Potential advantages include the listed amenities and access to nearby services in **${propLocality}**.\n\nHowever, the available information does not establish actual construction quality, noise levels, or legal status. Consider visiting the property and asking the seller about these points.`,
      timestamp: time,
      sources: ['Property listing', 'Location research', 'Information unavailable'],
      notVerifiedNotice: true
    };
  }

  // 6. Missing Information & Documentation Gaps
  if (
    q.includes('missing') ||
    q.includes('gap') ||
    q.includes('not provided') ||
    q.includes('incomplete') ||
    q.includes('unknown') ||
    q.includes('unverified')
  ) {
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `The current listing does not provide all the details you may want, such as a complete cost breakdown, a detailed floor plan, or verified information about construction quality.\n\nYou can ask the seller for clarification.`,
      timestamp: time,
      sources: ['Information unavailable', 'Seller-provided information'],
      notVerifiedNotice: true
    };
  }

  // 7. Questions to Ask the Seller / Due Diligence Checklist
  if (
    q.includes('question') ||
    q.includes('ask the seller') ||
    q.includes('seller') ||
    q.includes('checklist') ||
    q.includes('due diligence') ||
    q.includes('interview')
  ) {
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `Recommended questions to ask the seller or builder for **${propName}**:\n\n1. **Approvals**: Can you provide the sanctioned building plan and RERA registration certificate?\n2. **Total Outflow**: Does the quoted price include covered parking, club membership, and statutory deposits?\n3. **Title Deeds**: May I inspect the parent deed, title search report, and latest non-encumbrance certificate (Form 15)?\n4. **Handover & Penalties**: What is the committed possession date and what compensation clause applies in case of delay?\n5. **Maintenance**: What are the projected monthly maintenance fees and what body currently manages the premises?`,
      timestamp: time,
      sources: ['Property listing', 'Location research'],
      notVerifiedNotice: true
    };
  }

  // 8. Fit Buyer Preferences
  if (
    q.includes('preference') ||
    q.includes('fit') ||
    q.includes('suit') ||
    q.includes('match') ||
    q.includes('for me') ||
    q.includes('recommend')
  ) {
    const budgetNote = preferences?.budget_max 
      ? `Within your target range of ₹${(preferences.budget_max / 100000).toFixed(0)} Lakh.`
      : `Priced at ${propPrice}, representative of mid-to-premium properties in ${propLocality}.`;

    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `Based on standard buyer criteria for **${propName}**:\n\n• **Budget & Scale**: ${budgetNote}\n• **Spatial Requirements**: Offers **${propArea}** (${propType}), suitable for family living.\n• **Accessibility**: Connects into the **${propLocality}** road network with estimated 10–25 minute access to central hubs.\n\nTo evaluate this more closely against your specific priorities, consider your daily work commute anchors and target move-in date.`,
      timestamp: time,
      sources: ['Property listing', 'Sample calculation'],
      notVerifiedNotice: true
    };
  }

  // 9. Help / Capabilities
  if (q.includes('help') || q.includes('what can you do') || q.includes('features') || q.includes('who are you')) {
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `I can assist with evidence-oriented questions about **${propName}**:\n\n• Summary of physical specifications and pricing\n• Listed amenities and reported utilities\n• Nearby hospitals, schools, and commute estimates\n• Potential advantages, limitations, and missing documents\n• Preliminary questions to ask the seller\n\nPlease select one of the suggested question chips or type your question below.`,
      timestamp: time,
      sources: ['Property listing'],
      notVerifiedNotice: false
    };
  }

  // 10. Fallback Response for other questions
  return {
    id: `msg-${Date.now()}`,
    sender: 'assistant',
    text: `This simulated assistant can only demonstrate sample property information in this presentation.\n\nI can answer questions regarding **${propName}**'s listing specifications, amenities, nearby facilities, estimated costs, or due-diligence questions for the seller. For specific legal advice or custom pricing, please contact the seller directly.`,
    timestamp: time,
    sources: ['Information unavailable'],
    notVerifiedNotice: true
  };
}
