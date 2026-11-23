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
  for_you?: string;
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
    | 'safety_timeline'
    | 'air_quality_strip'
    | 'sun_path_diagram'
    | 'listed_vs_road'
    | 'commute_route_map';
  [key: string]: any;
}

export interface StandoutAnalysisData {
  signature_line: string;
  standouts: Array<{
    id: string;
    metric: string;
    claim: string;
    why: string;
    peer_context: string;
    changes_if: string;
  }>;
  worth_weighing: {
    id: string;
    metric: string;
    claim: string;
    why: string;
    changes_if: string;
  };
  questions: string[];
  data_that_would_strengthen: string[];
  footer: {
    peer_count: number;
    city: string;
    date: string;
    peer_set_definition: string;
    mode: string;
  };
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
  signature_line?: string;
  profile_header?: {
    text: string;
    hasEdit?: boolean;
    hasAddPlaces?: boolean;
  };
  tension?: {
    contrast: string;
    why?: string;
  };
  settle_first?: {
    recommendation: string;
    why?: string;
  };
  checks_you_can_make_now?: string[];
  footer_disclaimer?: string;
  footer_meta?: string;
}

export const SAMPLE_STANDOUT: StandoutAnalysisData = {
  signature_line: "Ranked against 6 active projects in Hyderabad: 78 homes per lift and 347 sq ft green cover per home.",
  standouts: [
    {
      id: "standout_lift_density",
      metric: "homes_per_passenger_lift",
      claim: "Each passenger lift serves 78 homes across 24 floors",
      why: "With 1,406 homes across 6 towers and 3 passenger lifts per tower, the ratio is 78 homes per lift. This determines morning core elevator dispatch wait times.",
      peer_context: "1 of 7 projects in Hyderabad",
      changes_if: "The builder changes lift speeds, cab capacities, or tower floor distributions."
    },
    {
      id: "standout_carpet_efficiency",
      metric: "carpet_efficiency_pct",
      claim: "69% of the paid area is private usable floor inside the walls",
      why: "In the 1,300 sq ft unit, 897 sq ft is carpet floor, 104 sq ft is balcony, and 299 sq ft is common circulation. The effective walk-in rate is ₹12,486 per carpet sq ft.",
      peer_context: "7 of 7 projects in Hyderabad",
      changes_if: "The builder quotes prices on a different area measurement baseline."
    },
    {
      id: "standout_green_area",
      metric: "green_area_per_home_sqft",
      claim: "The 16.5-acre site provides 347 sq ft of open green space per home",
      why: "68% central green coverage over 16.5 acres yields 488,743 sq ft of landscaped open ground shared among 1,406 residences.",
      peer_context: "7 of 7 projects in Hyderabad",
      changes_if: "Ground footprint allocations change in final sanctioned architectural drawings."
    }
  ],
  worth_weighing: {
    id: "worth_weighing_parking",
    metric: "parking_share_single_level_pct",
    claim: "Single-level underground parking would consume 63% of the entire site area",
    why: "With a car-free podium, 1 slot per home at 30 sq m per car requires 42,180 sq m of parking, requiring deep multi-level basement excavation.",
    changes_if: "The builder provides the approved number of basement levels and allotted slots per unit."
  },
  questions: [
    "How many basement levels are sanctioned, and how many parking slots are allotted per home?",
    "What are the rated speeds and weight capacities of the passenger lifts?",
    "Does the advertised 10 homes per floor include clubhouse and service corridors?"
  ],
  data_that_would_strengthen: [
    "Tower footprints and coordinates (needed for seasonal winter shadow calculation)",
    "Lift speed in meters per second and cab capacity in kilograms",
    "Rooftop solar plant capacity in kWp and STP daily processing volume in KLD",
    "Approved multi-level basement engineering drawings"
  ],
  footer: {
    peer_count: 6,
    city: "Hyderabad",
    date: "23 Nov 2026",
    peer_set_definition: "Published residential projects in Hyderabad under construction or new launch (excludes completed and self)",
    mode: "ranked"
  }
};

export const SAMPLE_ANALYSES: Record<string, SectionAnalysisData> = {
  neighbourhood: {
    sectionKey: 'neighbourhood',
    sectionTitle: 'Neighbourhood',
    briefing:
      'This is a drive-first location with a walkable errand core. Three grocery shops, a pharmacy and a bus stop sit within a 10-minute walk, but the metro is 4.7 km by road, 1.6 times the listed 3 km, and the nearest hospital is 2.6 km away. Of 14 projects within 5 km, this ranks 3rd for walkable errands and 11th for road distance to the metro.',
    visual: {
      type: 'listed_vs_road',
      places: [
        {
          name: 'Ratnadeep Supermarket',
          listedKm: 1.2,
          roadKm: 1.5,
          detourFactor: 1.25,
          category: 'Groceries',
          lat: 17.452,
          lon: 78.324
        },
        {
          name: 'Jubilee Hills Checkpost (metro)',
          listedKm: 3.0,
          roadKm: 4.7,
          detourFactor: 1.57,
          category: 'Metro',
          lat: 17.431,
          lon: 78.407
        },
        {
          name: 'Oakridge International',
          listedKm: 3.4,
          roadKm: 4.1,
          detourFactor: 1.21,
          category: 'School',
          lat: 17.412,
          lon: 78.348
        }
      ],
      walk10MinCounts: {
        groceries: 3,
        pharmacies: 1,
        cafes: 2,
        busStops: 1,
        clinics: 0,
        schools: 0
      },
      footerNote: 'Sample map data, Nov 2026. Peer set: 14 projects within 5 km (sample).'
    },
    findings: [
      {
        claim: 'The metro is 4.7 km by road, not 3 km.',
        why_it_follows:
          '3 km is the straight line. Roads add 57%: 14 minutes by car or about 59 on foot, with no walkable route under 45 minutes.',
        flip_condition: 'a pedestrian or feeder route to the station is confirmed.',
        tags: ['Builder (listed 3 km) · Nov 2026', 'Map (road route) · Nov 2026']
      },
      {
        claim: 'Errands are close; emergency care is not.',
        why_it_follows:
          '800 m covers 3 grocery shops, 1 pharmacy, 2 cafés and 1 bus stop. The nearest hospital is 2.6 km by road, 9 minutes by car, and none is listed on the page.',
        flip_condition: "the hospital's emergency department hours differ from the map data.",
        tags: ['Map · Nov 2026']
      },
      {
        claim: 'Services lie in two directions.',
        why_it_follows:
          'All supermarkets are north of the project and 5 of 6 mapped schools are east, so routine trips split between two corridors.',
        flip_condition: 'a school gate on the north side opens.',
        tags: ['Map · Nov 2026']
      }
    ],
    tension: {
      contrast:
        'On one hand the errand core is strong (3rd of 14 projects within 5 km). On the other, the metro is 11th of 14 by road distance, so the convenience is local, not regional.'
    },
    settle_first: {
      recommendation:
        'Ask whether the listed 3 km is road or straight-line, and which route residents are expected to use to reach the metro.'
    },
    checks_you_can_make_now: [
      'Trace the road route to the metro on the map and note any crossing without a signal.',
      'Search for clinics within 3 km and check their opening hours.',
      'Check bus frequency at the stop 650 m away.'
    ],
    questions: [
      'Is the 3 km to the metro by road or straight line?',
      'Which pedestrian or feeder route is recommended to reach the metro?',
      'What are the operating hours of the nearest emergency healthcare facility?'
    ],
    explainer: {
      formulas: [
        'Detour Factor = Road Distance ÷ Straight-Line Distance (e.g. 4.7 km ÷ 3.0 km = 1.57×).',
        'Walking Duration = Distance km ÷ 4.8 km/h pedestrian walking baseline.'
      ],
      assumptions: [
        'Road routes computed using OpenStreetMap road network geometry.',
        'Errand radius covers a 10-minute walk (800 m) along public pedestrian paths.'
      ]
    },
    footer_meta: 'Sample map data, Nov 2026. Peer set: 14 projects within 5 km (sample).'
  },

  liveability: {
    sectionKey: 'liveability',
    sectionTitle: 'Liveability',
    briefing:
      'Parks score best at **4.1** and have the most ratings (**128**). Pedestrian safety looks almost as good at **4.0**, but only **23** people rated it. Listed AQI **94** differs from the 7-day measured median of **41 µg/m³**, with cleanest hours between **13:00 and 16:00**.',
    visual: {
      type: 'air_quality_strip',
      hourly: [42, 40, 38, 37, 39, 44, 49, 53, 48, 41, 35, 31, 28, 27, 29, 33, 38, 45, 52, 58, 62, 59, 51, 46],
      cleanestWindow: '13:00–16:00 (cleanest: 28 µg/m³)',
      worstWindow: '19:00–22:00 (highest: 59 µg/m³)',
      medianPm25: 41,
      stationName: 'Central University TSPCB',
      distanceKm: 1.8
    },
    findings: [
      {
        claim: 'Listed AQI 94 differs from 7-day measured median of 41',
        why_it_follows: '168 hours of atmospheric records report a median PM2.5 of 41 µg/m³ with cleanest hours between 13:00 and 16:00. The nearest official CAAQMS station is Central University TSPCB at 1.8 km.',
        flip_condition: 'the builder commissions a certified on-site continuous ambient air monitor.',
        tags: ['modelled', 'calculated', 'monitor']
      },
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
    profile_header: {
      text: 'For you: 1 child in school · Office: DLF Cyber City · Priority: commute time',
      hasEdit: true,
      hasAddPlaces: true
    },
    briefing:
      'For a household with an office at DLF Cyber City and one child at Oakridge, the two daily trips cost about 357 hours a year, around 9 work weeks. The morning peak is the part that moves: the office trip takes 31 minutes at 08:30 against 22 in the listing.',
    visual: {
      type: 'commute_route_map',
      destinations: [
        {
          id: 'dlf_cyber_city',
          name: 'DLF Cyber City',
          type: 'office',
          roadDistanceKm: 8.5,
          times: {
            '08:30': 31,
            '11:00': 22,
            '18:30': 34
          },
          annualHours: 183,
          peakDelayHours: 38,
          coordinates: [17.4485, 78.3742]
        },
        {
          id: 'oakridge_school',
          name: 'Oakridge International',
          type: 'school',
          roadDistanceKm: 4.1,
          times: {
            '08:30': 16,
            '11:00': 13,
            '18:30': 15
          },
          annualHours: 173,
          peakDelayHours: 0,
          coordinates: [17.4124, 78.3486]
        }
      ],
      yearInTransit: {
        officeHours: 183,
        schoolHours: 173,
        peakExtraHours: 38,
        totalHours: 357,
        workWeeks: 8.9
      },
      footerNote: 'Sample traffic and map data, Nov 2026. Trips per day and days per year are assumptions you can edit.'
    },
    findings: [
      {
        claim: 'Your two daily trips cost about 357 hours a year.',
        why_it_follows:
          'The office is 183 hours (22 minutes x 2 trips x 250 days) and the school run 173 hours (13 minutes by road x 4 trips x 200 days). Together that is 357 hours, about 9 work weeks.',
        for_you: 'With one child at Oakridge, the school run is nearly as large as the office commute.',
        flip_condition: 'one parent covers both runs in a single loop, or the child uses a school bus.',
        tags: [
          'Map (road time) · Nov 2026',
          'You (destinations) · Nov 2026',
          'Assumed (trips and days) · Nov 2026'
        ]
      },
      {
        claim: 'The 08:30 departure adds about 38 hours a year.',
        why_it_follows:
          'At 08:30 the trip takes 31 minutes against the listed 22. Nine extra minutes across 250 mornings is 37.5 hours.',
        for_you: 'Departing during peak congestion shifts your annual travel time by nearly a full work week.',
        flip_condition: 'you leave before 07:30.',
        tags: ['Traffic (typical Tuesday, sample) · Nov 2026']
      },
      {
        claim: 'Cycling to the office takes 36 minutes against 22 by car.',
        why_it_follows:
          '8.5 km at an assumed 14 km/h. The map shows a cycle track on 3.1 km of the route.',
        for_you: 'Active transit is an alternative on days with favorable weather, utilizing the 3.1 km protected track.',
        flip_condition: 'a protected cycle route covers most of the 8.5 km.',
        tags: ['Map · Nov 2026', 'Assumed (cycling speed) · Nov 2026']
      }
    ],
    tension: {
      contrast:
        'On one hand both daily destinations are close: 8.5 km and 4.1 km by road. On the other, the office trip loses the most to the morning peak, while the school run is the steadier one.'
    },
    settle_first: {
      recommendation:
        'Check the 08:30 trip time on a weekday morning, and ask the school whether it runs a bus on your route.'
    },
    checks_you_can_make_now: [
      'Run the route at your own departure time.',
      'Add your second destination, so the totals reflect your real week.'
    ],
    questions: [
      'What is the typical traffic delay on the arterial link at 08:30?',
      'Does the school operate dedicated bus pick-up inside the gated community?',
      'Are there continuous cycling tracks connecting the site to the Cyber City corridor?'
    ],
    explainer: {
      formulas: [
        'Office Annual Commute = 22 min × 2 trips/day × 250 days ÷ 60 = 183.3 hours.',
        'School Annual Commute = 13 min × 4 trips/day × 200 days ÷ 60 = 173.3 hours.',
        'Total Annual Commute = 183.3 hrs + 173.3 hrs = 356.6 hrs (~9 work weeks).',
        'Morning Peak Extra = 9 min peak delay × 250 days ÷ 60 = 37.5 hours.'
      ],
      assumptions: [
        'Office year: 250 days with 2 trips/day.',
        'School year: 200 days with 4 trips/day (two round trips).',
        'Standard work week baseline: 40 hours.'
      ]
    },
    footer_meta: 'Sample traffic and map data, Nov 2026. Trips per day and days per year are assumptions you can edit.',
    hasAddMyPlaces: true
  },

  'master-plan': {
    sectionKey: 'master-plan',
    sectionTitle: 'Master plan',
    briefing:
      'Six towers, **1,406 homes**, 24 floors each. Tallest 72 m tower casts a **62.3 m noon shadow on 21 Dec** and **7.6 m on 21 Jun**. With 3 passenger lifts per tower, about **78 homes share each lift**, and underground parking occupies **about 63% of the site on a single level**.',
    visual: {
      type: 'sun_path_diagram',
      decSunriseAz: 114.6,
      decSunsetAz: 245.4,
      junSunriseAz: 65.4,
      junSunsetAz: 294.6,
      equinoxSunriseAz: 90.0,
      equinoxSunsetAz: 270.0,
      decNoonShadow: 62.3,
      junNoonShadow: 7.6,
      siteWidth: 258,
      towerHeight: 72
    },
    findings: [
      {
        claim: 'Tallest 72 m tower casts a 62.3 m noon shadow on 21 Dec',
        why_it_follows: 'At 17.45° N latitude, winter noon solar altitude is 49.1°, casting a 62.3 m shadow. Across the ~258 m site, shadows fall within the boundary between 08:32 and 15:28 IST.',
        flip_condition: 'the builder provides tower footprint coordinates or adjusts tower heights in sanctioned drawings.',
        tags: ['calculated']
      },
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

export interface AdvisorMatterItem {
  id: string;
  family: 'world' | 'market' | 'record' | 'buyer' | 'builder';
  topic: string;
  claim: string;
  why: string;
  for_you?: string;
  changes_if: string;
  source: string;
  date: string;
  confidence: number;
}

export interface AdvisorReadData {
  signature_line: string;
  what_matters_most: AdvisorMatterItem[];
  tension: {
    text: string;
    numbers: number[];
    sources: Array<{ family: string; source: string; date: string }>;
  };
  settle_first: {
    question: string;
    why: string;
    target: string;
    source?: string;
    date?: string;
  };
  checks_you_can_make_now: string[];
  evidence_panel: Record<string, {
    status: 'used' | 'not checked' | 'unavailable';
    source: string;
    date: string;
    confidence: number;
    reason?: string;
  }>;
  footer: {
    peer_count: number;
    city: string;
    disclaimer: string;
    sources_used: Array<{ family: string; source: string; date: string }>;
    generated_at: string;
  };
  has_buyer_profile?: boolean;
}

export const SAMPLE_ADVISOR_READ_GENERAL: AdvisorReadData = {
  signature_line: "Ranked across 7 active projects in Hyderabad: 78 homes per lift core capacity, paired with a 140-meter setback to the arterial feeder corridor.",
  what_matters_most: [
    {
      id: "world_noise_source",
      family: "world",
      topic: "noise and air",
      claim: "ORR Feeder Boulevard lies within 140 m of the northern boundary",
      why: "OpenStreetMap mapping indicates arterial road alignment at 140 m bearing NNE, introducing ambient road sound before interior acoustic barriers.",
      changes_if: "Acoustic glazed windows rated above 35 dB STC are fitted on northern facades",
      source: "OpenStreetMap",
      date: "23 Nov 2026",
      confidence: 0.7
    },
    {
      id: "market_lift_density",
      family: "market",
      topic: "amenities",
      claim: "Each passenger lift serves 78 homes, ranking 1 of 7 projects in Hyderabad",
      why: "With 18 passenger lifts distributed across 6 towers, lift core density is at the top of the cohort, directly moderating peak morning wait times.",
      changes_if: "Tower lift allocations or elevator car velocity specifications are revised",
      source: "Published Cohort",
      date: "23 Nov 2026",
      confidence: 0.8
    },
    {
      id: "market_carpet_efficiency",
      family: "market",
      topic: "price per usable foot",
      claim: "69% of the purchased footprint is private carpet area, pricing usable space at ₹12,486 per carpet sq ft",
      why: "In the base configuration, 897 sq ft out of 1,300 sq ft represents interior carpet floor, leaving 31% in balconies and common circulation.",
      changes_if: "The sale contract quotes usable area on RERA carpet rather than super built-up area",
      source: "Published Cohort",
      date: "23 Nov 2026",
      confidence: 0.8
    }
  ],
  tension: {
    text: "On one hand, each passenger lift serves 78 homes (favourable vertical core capacity in Hyderabad), but on the other hand, usable carpet efficiency is 69% with ₹12,486 per carpet sq ft.",
    numbers: [78, 69, 12486],
    sources: [
      { family: "market", source: "Published Cohort", date: "23 Nov 2026" },
      { family: "market", source: "Published Cohort", date: "23 Nov 2026" }
    ]
  },
  settle_first: {
    question: "Confirm the registered RERA completion date and statutory sanction filings on the official portal.",
    why: "Statutory timelines determine legal delay remedies and project handover obligations before financial commitments are executed.",
    target: "public_record",
    source: "official_record_portal",
    date: "23 Nov 2026"
  },
  checks_you_can_make_now: [
    "Audit the physical 140 m setback and road buffer along the northern boundary during evening rush hour.",
    "Request the sanctioned architectural unit drawings to verify if the 69% carpet ratio includes internal perimeter wall deductions.",
    "Inspect the state RERA portal to cross-reference sanctioned tower heights against marketing brochure counts."
  ],
  evidence_panel: {
    world: {
      status: "used",
      source: "OpenStreetMap, Open-Meteo, Solar Geometry, Open Elevation",
      date: "23 Nov 2026",
      confidence: 0.7
    },
    market: {
      status: "used",
      source: "7 published projects in Hyderabad",
      date: "23 Nov 2026",
      confidence: 0.8
    },
    record: {
      status: "not checked",
      source: "Telangana RERA Portal",
      date: "23 Nov 2026",
      confidence: 0.0,
      reason: "No permitted official direct API connection or uploaded official filing available"
    },
    buyer: {
      status: "not checked",
      source: "User Profile",
      date: "23 Nov 2026",
      confidence: 0.0,
      reason: "No buyer profile selected"
    }
  },
  footer: {
    peer_count: 6,
    city: "Hyderabad",
    disclaimer: "Decision support from listed data, public data and your inputs. Not financial, legal or investment advice.",
    sources_used: [
      { family: "world", source: "OpenStreetMap, Open-Meteo, Solar Geometry, Open Elevation", date: "23 Nov 2026" },
      { family: "market", source: "7 published projects in Hyderabad", date: "23 Nov 2026" }
    ],
    generated_at: "23 Nov 2026"
  },
  has_buyer_profile: false
};

export const SAMPLE_ADVISOR_READ_FOR_YOU: AdvisorReadData = {
  signature_line: "Ranked across 7 active projects in Hyderabad: 78 homes per lift core capacity, paired with a 140-meter setback to the arterial feeder corridor.",
  what_matters_most: [
    {
      id: "buyer_school_commute",
      family: "buyer",
      topic: "commute time",
      claim: "Annual commute to Oakridge International totals 160.0 hours across 200 travel days",
      why: "At 12 minutes one-way (4.6 km road route) with 4 daily school trips, this route consumes 4.0 standard 40-hour work weeks per year.",
      for_you: "For a household with a school run twice a day, I would weigh the 4.6 km road route before the clubhouse.",
      changes_if: "Hybrid remote schooling or a dedicated gated school shuttle bus is formally commissioned",
      source: "User Transit Schedule",
      date: "23 Nov 2026",
      confidence: 0.8
    },
    {
      id: "world_noise_source",
      family: "world",
      topic: "noise and air",
      claim: "ORR Feeder Boulevard lies within 140 m of the northern boundary",
      why: "OpenStreetMap mapping indicates arterial road alignment at 140 m bearing NNE, introducing ambient road sound before interior acoustic barriers.",
      for_you: "For a family with children studying, northern bedrooms demand verified acoustic window glazing.",
      changes_if: "Acoustic glazed windows rated above 35 dB STC are fitted on northern facades",
      source: "OpenStreetMap",
      date: "23 Nov 2026",
      confidence: 0.7
    },
    {
      id: "market_lift_density",
      family: "market",
      topic: "amenities",
      claim: "Each passenger lift serves 78 homes, ranking 1 of 7 projects in Hyderabad",
      why: "With 18 passenger lifts distributed across 6 towers, lift core density is at the top of the cohort, directly moderating peak morning wait times.",
      for_you: "For morning school and office departures, lower core congestion protects travel predictability.",
      changes_if: "Tower lift allocations or elevator car velocity specifications are revised",
      source: "Published Cohort",
      date: "23 Nov 2026",
      confidence: 0.8
    }
  ],
  tension: {
    text: "On one hand, each passenger lift serves 78 homes (favourable vertical core capacity in Hyderabad), but on the other hand, usable carpet efficiency is 69% with ₹12,486 per carpet sq ft.",
    numbers: [78, 69, 12486],
    sources: [
      { family: "market", source: "Published Cohort", date: "23 Nov 2026" },
      { family: "market", source: "Published Cohort", date: "23 Nov 2026" }
    ]
  },
  settle_first: {
    question: "Confirm the registered RERA completion date and statutory sanction filings on the official portal.",
    why: "Statutory timelines determine legal delay remedies and project handover obligations before financial commitments are executed.",
    target: "public_record",
    source: "official_record_portal",
    date: "23 Nov 2026"
  },
  checks_you_can_make_now: [
    "Audit the physical 140 m setback and road buffer along the northern boundary during evening rush hour.",
    "Request the sanctioned architectural unit drawings to verify if the 69% carpet ratio includes internal perimeter wall deductions.",
    "Inspect the state RERA portal to cross-reference sanctioned tower heights against marketing brochure counts."
  ],
  evidence_panel: {
    world: {
      status: "used",
      source: "OpenStreetMap, Open-Meteo, Solar Geometry, Open Elevation",
      date: "23 Nov 2026",
      confidence: 0.7
    },
    market: {
      status: "used",
      source: "7 published projects in Hyderabad",
      date: "23 Nov 2026",
      confidence: 0.8
    },
    record: {
      status: "not checked",
      source: "Telangana RERA Portal",
      date: "23 Nov 2026",
      confidence: 0.0,
      reason: "No permitted official direct API connection or uploaded official filing available"
    },
    buyer: {
      status: "used",
      source: "Household (1 school child) + Places (Oakridge School, DLF Cyber City)",
      date: "23 Nov 2026",
      confidence: 1.0
    }
  },
  footer: {
    peer_count: 6,
    city: "Hyderabad",
    disclaimer: "Decision support from listed data, public data and your inputs. Not financial, legal or investment advice.",
    sources_used: [
      { family: "buyer", source: "Household + Destination Places", date: "23 Nov 2026" },
      { family: "world", source: "OpenStreetMap, Open-Meteo, Solar Geometry, Open Elevation", date: "23 Nov 2026" },
      { family: "market", source: "7 published projects in Hyderabad", date: "23 Nov 2026" }
    ],
    generated_at: "23 Nov 2026"
  },
  has_buyer_profile: true
};

