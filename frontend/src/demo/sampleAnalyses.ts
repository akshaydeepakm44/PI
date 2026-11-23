/**
 * frontend/src/demo/sampleAnalyses.ts
 *
 * Dedicated sample analyses for Demo Mode (VITE_AI_ANALYSIS_MODE="demo").
 * Kept strictly isolated from real engines, validators, prompts, and database.
 * Never imported into the live calculation or backend paths.
 */

export interface DemoFinding {
  claim: string;
  why_it_follows: string;
  flip_condition: string;
  tags: string[];
}

export interface DemoVisualData {
  type:
    | 'distance_ladder'
    | 'rating_bars'
    | 'work_week_blocks'
    | 'parking_share_bar'
    | 'homes_per_floor_bars'
    | 'unit_stacked_bar'
    | 'amenity_split_bar'
    | 'sustainability_chips'
    | 'safety_timeline';
  [key: string]: any;
}

export interface DemoExplainer {
  formulas: string[];
  assumptions: string[];
}

export interface SectionAnalysisData {
  sectionKey: string;
  sectionTitle: string;
  briefing: string;
  visual: DemoVisualData;
  findings: DemoFinding[];
  questions: string[];
  explainer: DemoExplainer;
  hasAddMyPlaces?: boolean;
}

export const SAMPLE_ANALYSES: Record<string, SectionAnalysisData> = {
  neighbourhood: {
    sectionKey: 'neighbourhood',
    sectionTitle: 'Neighbourhood',
    briefing:
      'Groceries are the closest daily need at **1.2 km**, the metro is **3 km** away and the school **3.4 km**. No hospital or clinic appears in the places shown, so the data can’t say how far emergency care is.',
    visual: {
      type: 'distance_ladder',
      items: [
        { name: 'Ratnadeep Supermarket', distance: '1.2 km', category: 'Groceries' },
        { name: 'Jubilee Hills Checkpost (metro)', distance: '3.0 km', category: 'Metro station' },
        { name: 'Oakridge International', distance: '3.4 km', category: 'School' }
      ]
    },
    findings: [
      {
        claim: 'The school is nearly three times as far as the supermarket',
        why_it_follows: '3.4 km to the school against 1.2 km to the supermarket, a ratio of 2.8.',
        flip_condition: 'the distances are straight-line and the road routes differ.',
        tags: ['builder data', 'calculated']
      },
      {
        claim: 'No healthcare place is listed',
        why_it_follows: 'The places shown cover groceries, a school and a metro station only.',
        flip_condition: 'a hospital or clinic exists in the data but is not displayed.',
        tags: ['builder data']
      }
    ],
    questions: [
      'Is the 3 km to the metro by road or in a straight line?',
      'How far is the nearest hospital with emergency care?'
    ],
    explainer: {
      formulas: [
        'Distance Ratio = Distance to School ÷ Distance to Supermarket (3.4 km ÷ 1.2 km = 2.83×).'
      ],
      assumptions: [
        'Distance measurements represent one-way travel distances quoted in the listing.',
        'Place directory covers recorded daily-life destinations within 5 km.'
      ]
    }
  },

  liveability: {
    sectionKey: 'liveability',
    sectionTitle: 'Liveability',
    briefing:
      'Parks score best at **4.1** and have the most ratings (**128**). Pedestrian safety looks almost as good at **4.0**, but only **23** people rated it. The **62 dB** noise reading comes from a monitor in Gachibowli and AQI **94** is a single hourly reading, so neither describes this site.',
    visual: {
      type: 'rating_bars',
      items: [
        { label: 'Parks', score: 4.1, ratingsCount: 128 },
        { label: 'Cycle tracks', score: 3.6, ratingsCount: 74 },
        { label: 'Footpaths', score: 3.1, ratingsCount: 96 },
        { label: 'Pedestrian safety', score: 4.0, ratingsCount: 23 }
      ]
    },
    findings: [
      {
        claim: 'Pedestrian safety rests on only 23 ratings',
        why_it_follows: 'That is 23 against 128 for parks, so a few more ratings could move the score.',
        flip_condition: 'more resident ratings are added.',
        tags: ['builder data', 'calculated']
      },
      {
        claim: 'The noise and air numbers are not measured at the site',
        why_it_follows: '62 dB is from the Gachibowli noise monitor and AQI 94 is one hourly reading.',
        flip_condition: 'the monitors are close to the project; their distance is not stated.',
        tags: ['builder data']
      }
    ],
    questions: [
      'How far are the noise and air monitors from the site?',
      'Do the footpath ratings refer to this street or the wider area?'
    ],
    explainer: {
      formulas: [
        'Sample Weight Ratio = Park Reviews ÷ Pedestrian Safety Reviews (128 ÷ 23 = 5.57× confidence disparity).'
      ],
      assumptions: [
        'Review scores aggregate resident ratings submitted via public mapping services.',
        'Noise and AQI telemetry sourced from regional municipal sensor stations.'
      ]
    }
  },

  commute: {
    sectionKey: 'commute',
    sectionTitle: 'My Commute',
    briefing:
      'From this project it is **22 minutes each way to DLF Cyber City**. Over 250 working days that adds up to about **183 hours a year**, or **4.6 work weeks** spent travelling. The trip averages **23 km/h** over 8.5 km, while the 32 km airport run averages **43 km/h**, which suggests the slow part of your day is the local roads, not the distance.',
    visual: {
      type: 'work_week_blocks',
      annualHours: 183,
      workWeeks: 4.6,
      caption: '183 hours a year (2 trips a day, 250 days: assumed)'
    },
    findings: [
      {
        claim: 'A year of this commute is about 183 hours',
        why_it_follows: '22 minutes × 2 trips a day × 250 working days.',
        flip_condition: 'you work from home some days or have a different number of office days.',
        tags: ['builder data', 'calculated', 'assumed']
      },
      {
        claim: 'Short trips are slow, long ones are fast',
        why_it_follows: '8.5 km in 22 minutes is 23 km/h; 32 km in 45 minutes is 43 km/h.',
        flip_condition: 'the two times were measured at different hours of the day.',
        tags: ['builder data', 'calculated']
      }
    ],
    questions: [
      'Is the 22 minutes for peak hour or off-peak?',
      'Is it live traffic or a fixed estimate?'
    ],
    explainer: {
      formulas: [
        'Annual Commute Hours = One-way duration × 2 trips daily × 250 working days ÷ 60 min (22 min × 500 trips ÷ 60 = 183.3 hrs).',
        'Equivalent Work Weeks = Annual hours ÷ standard 40-hour work week (183.3 hrs ÷ 40 hrs = 4.58 weeks).',
        'Average Speed = Distance km ÷ (Time min ÷ 60) (8.5 km ÷ [22/60] hrs = 23.2 km/h).'
      ],
      assumptions: [
        'Working year: 250 office days per calendar year (assuming a 5-day week, excluding public holidays).',
        'Frequency: 2 one-way trips per office day (morning outbound and evening return).'
      ]
    },
    hasAddMyPlaces: true
  },

  'master-plan': {
    sectionKey: 'master-plan',
    sectionTitle: 'Master plan',
    briefing:
      'Six towers, **1,406 homes**, 24 floors each. Every tower has 3 passenger lifts, so about **78 homes share each lift**. And because cars are underground, the basement has to be large: with one slot per home it would take **about 63% of the site on a single level**.',
    visual: {
      type: 'parking_share_bar',
      sharePct: 63,
      parkingAreaSqM: '42,180',
      totalSiteSqM: '66,773',
      label: '42,180 sq m of parking on a 66,773 sq m site, one level (1 slot per home, 30 sq m per slot: assumed)'
    },
    findings: [
      {
        claim: 'A car-free podium means a big basement',
        why_it_follows: '1,406 slots × 30 sq m is 42,180 sq m, 63% of the 66,773 sq m site on one level.',
        flip_condition: 'the builder gives the real slot count and number of basement levels.',
        tags: ['calculated', 'assumed']
      },
      {
        claim: '78 homes share each passenger lift',
        why_it_follows: '234 or 235 homes and 3 passenger lifts in each tower.',
        flip_condition: 'the builder gives the lift speed and car size; neither is in the data.',
        tags: ['builder data', 'calculated']
      }
    ],
    questions: [
      'How many basement levels, and how many slots per home?',
      'How fast are the lifts and how large is each car?'
    ],
    explainer: {
      formulas: [
        'Homes per Lift = Total units ÷ total passenger lifts across towers (1,406 homes ÷ 18 lifts = 78.1 homes/lift).',
        'Single-Level Parking Footprint = Total homes × 1 slot × 30 sq m per bay (1,406 × 30 = 42,180 sq m).',
        'Parking Share = Parking area ÷ total site area (42,180 sq m ÷ 66,773 sq m = 63.2%).'
      ],
      assumptions: [
        'Site area: 16.5 acres = 66,773.13 square metres.',
        'Parking allotment: 1 standard vehicular bay per home with 30 sq m per slot (including driveways and structural columns).'
      ]
    }
  },

  towers: {
    sectionKey: 'towers',
    sectionTitle: 'Towers & blocks',
    briefing:
      'All six towers have **24 floors** in the data and 3 passenger lifts each, with **234 or 235 homes** per tower. At 10 homes a floor each tower would have 240, so the listed totals fall short by **5 or 6 homes** per tower, **34 in all**.',
    visual: {
      type: 'homes_per_floor_bars',
      towers: [
        { letter: 'A', homesPerFloor: 9.75 },
        { letter: 'B', homesPerFloor: 9.75 },
        { letter: 'C', homesPerFloor: 9.79 },
        { letter: 'D', homesPerFloor: 9.79 },
        { letter: 'E', homesPerFloor: 9.75 },
        { letter: 'F', homesPerFloor: 9.75 }
      ],
      declaredTarget: 10
    },
    findings: [
      {
        claim: 'Every tower is 5 or 6 homes short of 10 a floor',
        why_it_follows: '24 floors × 10 homes = 240; the towers list 234 or 235.',
        flip_condition: 'units per floor vary by level, for example fewer homes on the top floors.',
        tags: ['builder data', 'calculated']
      },
      {
        claim: 'About 78 homes share each passenger lift',
        why_it_follows: '234 or 235 homes, 3 passenger lifts and 2 service lifts per tower.',
        flip_condition: 'lift speed and car size are provided.',
        tags: ['builder data', 'calculated']
      }
    ],
    questions: [
      'Do some floors hold fewer than 10 homes?',
      'What are the lift speed and car size?',
      'Where is the refuge area?'
    ],
    explainer: {
      formulas: [
        'Declared vs Actual Gap = (24 floors × 10 declared homes/floor × 6 towers) - 1,406 total units = 34 units.',
        'Average homes per floor = Tower units ÷ 24 floors (234 ÷ 24 = 9.75, 235 ÷ 24 = 9.79).'
      ],
      assumptions: [
        'Floors per tower: 24 habitable levels identical across all 6 towers.',
        'Passenger lift allocation: 3 dedicated passenger cars plus 2 dedicated service cars per tower.'
      ]
    }
  },

  units: {
    sectionKey: 'units',
    sectionTitle: 'Unit plans & pricing',
    briefing:
      'The ₹1.12 Cr 2 BHK is really **₹12,486 for every sq ft you can walk on**, not the ₹8,615 in the brochure. Of the 1,300 sq ft you pay for, **897 is inside the walls**, 104 is balcony and 299 is shared space. Moving up to the 3 BHK adds 400 sq ft of floor for ₹50 L, which is **about the same rate**. The 31 December offer is worth the most on high floors.',
    visual: {
      type: 'unit_stacked_bar',
      carpetSqFt: 897,
      carpetPct: 69,
      balconySqFt: 104,
      balconyPct: 8,
      sharedSqFt: 299,
      sharedPct: 23
    },
    findings: [
      {
        claim: 'Only 69% of what you pay for is floor inside the walls',
        why_it_follows: '₹8,615 per sq ft on the brochure; ₹12,486 per carpet sq ft, or ₹11,189 counting the 104 sq ft balcony.',
        flip_condition: 'the builder quotes the price on a different area basis.',
        tags: ['builder data', 'calculated']
      },
      {
        claim: 'The third bedroom costs the same per foot as the first two',
        why_it_follows: '400 extra carpet sq ft for ₹50 L is ₹12,500 per sq ft; the 2 BHK is ₹12,486.',
        flip_condition: 'a facing or floor premium applies to one home and not the other.',
        tags: ['builder data', 'calculated']
      },
      {
        claim: 'The December offer is worth far more on high floors',
        why_it_follows:
          'At floor rise of ₹50 per sq ft per floor, waiving it saves up to ₹13 L at floor 24 and at most ₹65,000 at floor 5. Days left: 38 days until 31 Dec.',
        flip_condition: 'floor rise is a flat charge, or the 5th floor pays nothing.',
        tags: ['builder data', 'calculated', 'assumed']
      }
    ],
    questions: [
      'Does the 5th floor pay floor rise, or does it start at the 6th?',
      'Is the balcony inside the ₹8,600 base rate?',
      'Do the facing and view premiums apply to every home?'
    ],
    explainer: {
      formulas: [
        'Carpet sq ft rate = Quoted price ÷ carpet area inside walls (₹1.12 Cr ÷ 897 sq ft = ₹12,486/sq ft).',
        'Carpet efficiency = Carpet area ÷ super built-up brochure area (897 sq ft ÷ 1,300 sq ft = 69.0%).',
        'Marginal expansion rate = Price delta ÷ carpet area delta (₹50 L ÷ 400 sq ft = ₹12,500/sq ft).',
        'Floor rise waiver savings = Floors above start floor × floor rise rate × super built-up area.'
      ],
      assumptions: [
        'Start floor: floor rise begins on floor 5 (floors 1–4 are flat).',
        'Area composition: 897 sq ft carpet, 104 sq ft balcony, 299 sq ft common/circulation.'
      ]
    }
  },

  amenities: {
    sectionKey: 'amenities',
    sectionTitle: 'Amenities',
    briefing:
      'The project lists **16 amenities**, 7 indoors and 9 outdoors. The 40,000 sq ft clubhouse spans three floors, about 13,300 sq ft each, and works out at **28 sq ft per home**. The pool is on the podium, not in the clubhouse, and its size is not given.',
    visual: {
      type: 'amenity_split_bar',
      indoorCount: 7,
      indoorPct: 44,
      outdoorCount: 9,
      outdoorPct: 56,
      totalCount: 16
    },
    findings: [
      {
        claim: 'The clubhouse comes to 28 sq ft per home',
        why_it_follows: '40,000 sq ft divided by 1,406 homes is 28.4 sq ft.',
        flip_condition: 'the 40,000 sq ft counts only indoor space, or includes terraces.',
        tags: ['builder data', 'calculated']
      },
      {
        claim: 'The pool’s size and the number of guest suites are not stated',
        why_it_follows: 'The data lists a podium pool and a clubhouse but no pool dimensions and no guest-suite count.',
        flip_condition: 'the builder’s drawings give them.',
        tags: ['builder data']
      }
    ],
    questions: [
      'What are the pool dimensions?',
      'How many guest suites are there?',
      'Are all 16 amenities ready at handover?'
    ],
    explainer: {
      formulas: [
        'Clubhouse Share per Home = Total clubhouse area ÷ total units (40,000 sq ft ÷ 1,406 units = 28.4 sq ft/home).',
        'Floor Plate Allocation = Clubhouse area ÷ floors (40,000 sq ft ÷ 3 floors = 13,333 sq ft/floor).'
      ],
      assumptions: [
        'Clubhouse footprint: 40,000 sq ft across 3 levels.',
        '1,406 residential households sharing common club facilities.'
      ]
    }
  },

  sustainability: {
    sectionKey: 'sustainability',
    sectionTitle: 'Sustainability',
    briefing:
      'Six of eight sustainability features are listed, including solar, a sewage treatment plant and EV charging, but none comes with a capacity. The **IGBC Platinum** rating is a **pre-certification from 2024**, not a final certificate.',
    visual: {
      type: 'sustainability_chips',
      available: [
        'Rainwater harvesting',
        'Solar',
        'STP',
        'EV charging',
        'Building automation',
        'Waste segregation'
      ],
      notAvailable: [
        'Greywater recycling',
        'Smart home provision'
      ]
    },
    findings: [
      {
        claim: 'The green rating is a pre-certification',
        why_it_follows: 'IGBC Platinum shows as pre-certified in 2024, and no final certificate is recorded.',
        flip_condition: 'the builder holds a final certificate that is not in the data.',
        tags: ['builder data']
      },
      {
        claim: 'No feature has a size',
        why_it_follows: 'Solar capacity (kWp), STP capacity (KLD) and the number of EV charging points are not stated.',
        flip_condition: 'the builder provides them.',
        tags: ['builder data']
      }
    ],
    questions: [
      'What is the solar capacity in kWp?',
      'What is the STP capacity in KLD?',
      'How many EV charging points are installed?'
    ],
    explainer: {
      formulas: [
        'Infrastructure Provision Ratio = Available features ÷ evaluated baseline features (6 ÷ 8 = 75.0%).'
      ],
      assumptions: [
        'Sustainability baseline evaluates 8 standard residential green criteria.',
        'Certification status as recorded in builder prospectus GH22P1488.'
      ]
    }
  },

  safety: {
    sectionKey: 'safety',
    sectionTitle: 'Safety & security',
    briefing:
      'Five of six safety features are listed: 24/7 security, CCTV, visitor management, an evacuation plan and safety certification. Video door phones are not included. The fire NOC is provisional (2024) and the final one is issued before handover, about **7 months away**.',
    visual: {
      type: 'safety_timeline',
      targetDate: 'Jun 2027',
      monthsRemaining: 7,
      provisionalNocYear: '2024',
      markerText: 'final fire NOC due before this'
    },
    findings: [
      {
        claim: 'The fire NOC is provisional',
        why_it_follows: 'Telangana Fire Services issued a provisional NOC in 2024; the final one is issued before handover.',
        flip_condition: 'the final NOC has already been issued.',
        tags: ['builder data']
      },
      {
        claim: 'Video door phones are the one missing feature',
        why_it_follows: 'Five of six safety features are listed; intercom / video door phones are not in this project.',
        flip_condition: 'an intercom is offered as an option.',
        tags: ['builder data']
      }
    ],
    questions: [
      'When is the final fire NOC expected?',
      'Is a video door phone available as an option?'
    ],
    explainer: {
      formulas: [
        'Safety Coverage Index = Available provisions ÷ total standard security features (5 ÷ 6 = 83.3%).',
        'Handover Timeline Gap = Possession target (Jun 2027) - current project audit stage.'
      ],
      assumptions: [
        'Fire NOC compliance regulated by Telangana State Disaster Response and Fire Services Department.',
        'Final clearance certificate mandatory prior to occupancy certificate (OC).'
      ]
    }
  }
};
