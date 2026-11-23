import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi, wishlistApi, enquiryApi, intelligenceApi, routingApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AIAssistantChat } from '../../components/assistant/AIAssistantChat';
import { PropertyMap } from '../../components/common/PropertyMap';
import { SectionAIAnalysis } from '../../components/intelligence/SectionAIAnalysis';
import { StandoutAIAnalysis } from '../../components/intelligence/StandoutAIAnalysis';
import { AdvisorReadCard } from '../../components/intelligence/AdvisorReadCard';
import {
  MapPin,
  Bookmark,
  Calendar,
  Layers,
  Building2,
  SlidersHorizontal,
  Search,
  Check,
  ChevronDown,
  ArrowUpDown,
  Home,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  PhoneCall,
  X,
  Maximize2,
  FileText,
  ShieldCheck,
  Shield,
  Activity,
  Trees,
  Compass,
  Car,
  Bot,
  Send,
  Info,
  CheckCircle2,
  Award,
  Flame,
  UserCheck,
  Video
} from 'lucide-react';

// Static client data for Ramky Kingston Park Orbit
const PLACES_DATA: Record<string, [string, string, string][]> = {
  All: [
    ['Jubilee Hills Checkpost', 'Metro station · Blue Line', '3'],
    ['Oakridge International', 'School · CBSE, IB', '3.4'],
    ['Ratnadeep Supermarket', 'Groceries · Nallagandla', '1.2'],
    ['Citizens Specialty Hospital', 'Hospital · Nallagandla', '2.4'],
    ['DLF Cyber City', 'IT park · Gachibowli', '4.4']
  ],
  'Metro stations': [
    ['Jubilee Hills Checkpost', 'Metro station · Blue Line', '3'],
    ['Peddamma Gudi', 'Metro station · Blue Line', '3.5'],
    ['Madhapur', 'Metro station · Blue Line', '3.9']
  ],
  'Bus stops': [
    ['Gopanapally X Roads', 'Bus stop · TSRTC', '0.8'],
    ['Nallagandla', 'Bus stop · TSRTC', '1.6'],
    ['Gachibowli DLF', 'Bus stop · TSRTC', '4.2']
  ],
  Schools: [
    ['Glendale Academy', 'School · CBSE', '2.1'],
    ['Oakridge International', 'School · CBSE, IB', '3.4'],
    ['Sancta Maria International', 'School · IB, IGCSE', '4.8']
  ],
  Groceries: [
    ['Ratnadeep Supermarket', 'Supermarket · Nallagandla', '1.2'],
    ['More Supermarket', 'Supermarket · Tellapur Rd', '1.9'],
    ['Star Bazaar', 'Hypermarket · Gachibowli', '5.1']
  ],
  'Pharmacies & clinics': [
    ['Apollo Pharmacy', 'Pharmacy · open 24 hours', '0.9'],
    ['Citizens Specialty Hospital', 'Hospital · Nallagandla', '2.4'],
    ['Continental Hospitals', 'Hospital · Financial District', '6']
  ],
  'Cafés & restaurants': [
    ['Third Wave Coffee', 'Café · Nallagandla', '2'],
    ['Chutneys', 'Restaurant · Gachibowli', '4.6'],
    ['Roastery Coffee House', 'Café · Kondapur', '6.5']
  ],
  'Offices & IT parks': [
    ['Wipro Circle', 'Office hub · Financial District', '2.8'],
    ['DLF Cyber City', 'IT park · Gachibowli', '4.4'],
    ['Financial District', 'Office district', '5.5']
  ],
  Parks: [
    ['Gopi Cheruvu Lake', 'Lake park · Nallagandla', '2.3'],
    ['Botanical Garden', 'Park · Kondapur', '6.2'],
    ['KBR National Park', 'National park', '11']
  ],
  'Cycle tracks': [
    ['ORR Healthway cycle track', 'Covered track · 23 km', '3.1'],
    ['Gachibowli Stadium loop', 'Loop · 2.5 km', '5.2'],
    ['Botanical Garden trail', 'Trail · 1.8 km', '6.2']
  ],
  'Culture & leisure': [
    ['AMB Cinemas', 'Cinema · Gachibowli', '6.8'],
    ['Shilparamam', 'Crafts village · Madhapur', '9'],
    ['Durgam Cheruvu', 'Lake & cable bridge', '10.5']
  ]
};

const LIVEABILITY_DATA: [string, string, string, number, string][] = [
  ['Parks', 'Good', '4.1 / 5 · 128 ratings', 4, 'From Google Maps reviews'],
  ['Cycle tracks', 'Good', '3.6 / 5 · 74 ratings', 4, 'From Google Maps reviews'],
  ['Footpaths', 'Average', '3.1 / 5 · 96 ratings', 3, 'From resident reviews on this site'],
  ['Pedestrian safety', 'Good', '4 / 5 · 23 ratings', 3, 'From resident reviews on this site'],
  ['Traffic & noise', 'Moderate', '62 dB daytime', 3, 'TSPCB noise monitor, Gachibowli'],
  ['Air quality', 'Satisfactory', 'AQI 94', 3, 'Live from CPCB · updated hourly']
];

const COMMUTE_DESTINATIONS = [
  { name: 'DLF Cyber City', subtitle: 'Office park · Gachibowli', distance: '8.5', time: '22', frequency: 'Daily' },
  { name: 'Gachibowli Stadium', subtitle: 'Sports venue · Gachibowli', distance: '9', time: '24', frequency: 'Frequently' },
  { name: 'Indian School of Business', subtitle: 'Campus · Gachibowli', distance: '10', time: '28', frequency: 'Frequently' },
  { name: 'Rajiv Gandhi Intl Airport', subtitle: 'Airport · Shamshabad', distance: '32', time: '38', frequency: 'Occasionally' }
];

const TOWERS_DATA = [
  { letter: 'A', homes: 240, floors: 24, unitsPerFloor: 8, lifts: 3 },
  { letter: 'B', homes: 240, floors: 24, unitsPerFloor: 8, lifts: 3 },
  { letter: 'C', homes: 236, floors: 24, unitsPerFloor: 8, lifts: 3 },
  { letter: 'D', homes: 230, floors: 24, unitsPerFloor: 8, lifts: 3 },
  { letter: 'E', homes: 230, floors: 24, unitsPerFloor: 8, lifts: 3 },
  { letter: 'F', homes: 230, floors: 24, unitsPerFloor: 8, lifts: 3 }
];

const UNITS_DATA = [
  {
    id: 'unit-2bhk',
    bhk: 2,
    facing: 'East',
    size: 1300,
    price: '1.12',
    towers: 'A and C',
    image: '/design/unit-2bhk.jpeg',
    facts: ['897', '68', '335', '41']
  },
  {
    id: 'unit-3bhk-east',
    bhk: 3,
    facing: 'East',
    size: 1880,
    price: '1.62',
    towers: 'B and D',
    image: '/design/unit-3bhk-east.jpeg',
    facts: ['1,297', '94', '489', '59']
  },
  {
    id: 'unit-3bhk-west',
    bhk: 3,
    facing: 'West',
    size: 1880,
    price: '1.65',
    towers: 'E and F',
    image: '/design/unit-3bhk-west.jpeg',
    facts: ['1,297', '94', '489', '59']
  }
];

const AMENITIES_DATA = [
  { name: 'Swimming pool', icon: 'pool', type: 'Outdoor', location: 'Clubhouse podium', details: true },
  { name: 'Gym', icon: 'gym', type: 'Indoor', location: 'Clubhouse, 1st floor', details: true },
  { name: 'Kids’ play area', icon: 'play', type: 'Outdoor', location: 'Central greens', details: false },
  { name: 'Jogging track', icon: 'jogging', type: 'Outdoor', location: 'Around the central greens', details: true },
  { name: 'Indoor games room', icon: 'games', type: 'Indoor', location: 'Clubhouse, ground floor', details: false },
  { name: 'Party hall', icon: 'party', type: 'Indoor', location: 'Clubhouse, 2nd floor', details: true },
  { name: 'Co-working space', icon: 'smart', type: 'Indoor', location: 'Clubhouse, 1st floor', details: false },
  { name: 'Library', icon: 'smart', type: 'Indoor', location: 'Clubhouse, 2nd floor', details: false },
  { name: 'Crèche', icon: 'play', type: 'Indoor', location: 'Clubhouse, ground floor', details: false },
  { name: 'Table tennis', icon: 'games', type: 'Indoor', location: 'Clubhouse, ground floor', details: false },
  { name: 'Yoga deck', icon: 'jogging', type: 'Outdoor', location: 'Clubhouse terrace', details: false },
  { name: 'Tennis court', icon: 'games', type: 'Outdoor', location: 'Sports zone', details: false },
  { name: 'Basketball court', icon: 'games', type: 'Outdoor', location: 'Sports zone', details: false },
  { name: 'Amphitheatre', icon: 'party', type: 'Outdoor', location: 'Central greens', details: false },
  { name: 'Seating plaza', icon: 'podium', type: 'Outdoor', location: 'Along the central greens', details: false },
  { name: 'Cricket practice nets', icon: 'games', type: 'Outdoor', location: 'Sports zone', details: false }
];

const SUSTAINABILITY_DATA = [
  { name: 'Rainwater harvesting', icon: 'rainwater', details: true, unavailable: false },
  { name: 'Solar power generation', icon: 'solar', details: false, unavailable: false },
  { name: 'Sewage treatment plant (STP)', icon: 'water', details: false, unavailable: false },
  { name: 'EV charging points', icon: 'ev', details: true, unavailable: false },
  { name: 'Building automation (BMS)', icon: 'automation', details: false, unavailable: false },
  { name: 'Waste segregation', icon: 'waste', details: false, unavailable: false },
  { name: 'Greywater recycling', icon: 'recycle', details: false, unavailable: true },
  { name: 'Smart home provision', icon: 'smart', details: false, unavailable: true }
];

const SAFETY_DATA = [
  { name: '24/7 security', icon: 'security-story', details: true, unavailable: false },
  { name: 'CCTV surveillance', icon: 'automation', details: false, unavailable: false },
  { name: 'Visitor management system', icon: 'smart', details: false, unavailable: false },
  { name: 'Emergency evacuation plan', icon: 'sun-story', details: true, unavailable: false },
  { name: 'Safety certification', icon: 'podium', details: false, unavailable: false },
  { name: 'Intercom / video door phones', icon: 'smart', details: false, unavailable: true }
];

const SECTIONS = [
  { id: 'neighbourhood', label: 'Neighbourhood' },
  { id: 'liveability', label: 'Liveability' },
  { id: 'commute', label: 'My Commute' },
  { id: 'master-plan', label: 'Master plan' },
  { id: 'towers', label: 'Towers & blocks' },
  { id: 'units', label: 'Unit plans & pricing' },
  { id: 'amenities', label: 'Amenities' },
  { id: 'sustainability', label: 'Sustainability' },
  { id: 'safety', label: 'Safety & security' }
];

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const propertyId = parseInt(id || '1', 10);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Navigation and active section spy
  const [activeSection, setActiveSection] = useState('neighbourhood');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedUnitBhk, setSelectedUnitBhk] = useState<'all' | number>('all');
  const [amenityFilter, setAmenityFilter] = useState<'All' | 'Indoor' | 'Outdoor'>('All');
  const [viewAllAmenities, setViewAllAmenities] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Modals state
  const [floorModalUnit, setFloorModalUnit] = useState<any | null>(null);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [masterPlanModalOpen, setMasterPlanModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiAssistantPrompt, setAiAssistantPrompt] = useState<string>('');

  const handleAskFollowUp = (context: string) => {
    setAiAssistantPrompt(context);
    setAiAssistantOpen(true);
  };

  // Property details query
  const { data: property, isLoading } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => propertyApi.getProperty(propertyId),
    enabled: propertyId > 0
  });

  // Scroll spy on sections
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 120;
      for (const sec of SECTIONS) {
        const el = document.getElementById(sec.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sec.id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (secId: string) => {
    const el = document.getElementById(secId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredUnits = useMemo(() => {
    const rawConfigs = property?.modules_data?.configurations;
    if (rawConfigs && Array.isArray(rawConfigs) && rawConfigs.length > 0) {
      const mapped = rawConfigs.map((c: any, idx: number) => ({
        id: `unit-${c.bhk || idx}`,
        bhk: c.bhk || 2,
        facing: c.facing || 'East',
        size: c.sbu_sqft || c.carpet_sqft || 1300,
        price: c.price_cr ? `${c.price_cr}` : (c.price_text || '1.12'),
        towers: 'Tower blocks',
        image: '/design/unit-2bhk.jpeg',
        facts: [`${c.carpet_sqft || 897}`, '68', `${c.sbu_sqft || 1300}`, '41']
      }));
      if (selectedUnitBhk === 'all') return mapped;
      return mapped.filter((u: any) => u.bhk === selectedUnitBhk);
    }
    if (selectedUnitBhk === 'all') return UNITS_DATA;
    return UNITS_DATA.filter(u => u.bhk === selectedUnitBhk);
  }, [selectedUnitBhk, property]);

  const filteredAmenities = useMemo(() => {
    let list = AMENITIES_DATA;
    if (amenityFilter !== 'All') {
      list = list.filter(a => a.type === amenityFilter);
    }
    return viewAllAmenities ? list : list.slice(0, 8);
  }, [amenityFilter, viewAllAmenities]);

  const displayedPlaces: [string, string, string][] = (property?.modules_data?.neighbourhood_places?.[selectedCategory] as [string, string, string][]) || PLACES_DATA[selectedCategory] || PLACES_DATA['All'];

// Dynamic fields with fallback to Property 1 defaults
const projectName = property?.name || 'Ramky Kingston Park Orbit';
const projectRera = property?.survey_number?.startsWith('P0')
  ? `RERA ${property.survey_number}`
  : (property?.survey_number ? property.survey_number : 'RERA P02400005821');
const projectLocality = property
  ? `${property.locality || ''}, ${property.city || ''} · by ${property.seller_name || ''}`
  : 'Gopanapally, Hyderabad · by Ramky Estates';
const projectPrice = property?.asking_price || '₹1.12 – 1.62 Cr';
const projectStatus = property?.construction_status || 'Under construction';
const projectPossession = property?.possession_date
  ? `Possession ${property.possession_date}`
  : 'Possession Jun 2027';
const projectAcres = property?.modules_data?.master_plan?.acreage
  ? `${property.modules_data.master_plan.acreage}`
  : (property?.area ? `${property.area} ${property.area_unit || 'sq ft'}` : '16.5');
const projectUnits = property?.unit_count ? property.unit_count.toLocaleString() : '1,406';
const projectFloors = property?.floors ? `${property.floors}` : '24';
const projectTowers = property?.towers ? `${property.towers}` : '6';
const heroPhoto = (property?.photos && property.photos.length > 0 && typeof property.photos[0] === 'object' && property.photos[0].url)
  ? property.photos[0].url
  : '/design/hero.jpeg';

return (
  <div className="bg-[#fcfcfc] text-[#111111]">
    {/* Detail Page Hero Header Container */}
    <div className="page-container" style={{ paddingTop: '24px' }}>
      {/* Breadcrumb + Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <Link to="/directory" className="text-xs text-[#5c5c5c] hover:text-[#111111] inline-flex items-center gap-1 mb-2 font-medium">
            ← Back to all projects
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-heading font-bold tracking-tight text-[#111111]">
              {projectName}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#eef7f1] text-[#1e6b3a] border border-[#bfddc9]">
              {projectRera}
            </span>
          </div>
          <p className="text-xs text-[#5c5c5c] mt-1">
            {projectLocality}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSaved(!isSaved)}
            className="px-4 py-2 rounded-md border border-[#ddd] bg-white text-xs font-semibold text-[#111] hover:bg-[#f7f7f7] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Bookmark size={15} fill={isSaved ? '#10261a' : 'none'} />
            <span>{isSaved ? 'Saved' : 'Save project'}</span>
          </button>
          <button
            type="button"
            onClick={() => setContactModalOpen(true)}
            className="px-4 py-2 rounded-md bg-[#10261a] text-white text-xs font-semibold hover:bg-[#1e6b3a] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <PhoneCall size={14} />
            <span>Talk to the developer</span>
          </button>
        </div>
      </div>

      {/* Top Gallery Banner matching client portal */}
      <div className="hero">
        <img
          src={heroPhoto}
          alt={`${projectName} — project view`}
        />
        <button
          type="button"
          className="button button--secondary button--compact image-action"
          onClick={() => setGalleryModalOpen(true)}
        >
          <span>View all images</span>
        </button>
      </div>

      {/* Key Facts Metric Strip */}
      <div className="key-facts">
        <div className="key-fact">
          <p><Award size={18} /> Price range</p>
          <strong>{projectPrice}</strong>
          <small>Starting price</small>
        </div>

        <div className="key-fact status-fact">
          <p><Calendar size={18} /> Status</p>
          <strong>{projectStatus}</strong>
          <small>{projectPossession}</small>
        </div>

        <div className="key-fact">
          <p><Layers size={18} /> Acres / Area</p>
          <strong>{projectAcres}</strong>
          <small>Total footprint</small>
        </div>

        <div className="key-fact">
          <p><Home size={18} /> Units</p>
          <strong>{projectUnits}</strong>
          <small>Total homes</small>
        </div>

        <div className="key-fact">
          <p><Building2 size={18} /> Floors (tallest)</p>
          <strong>{projectFloors}</strong>
          <small>Levels</small>
        </div>

        <div className="key-fact">
          <p><Building2 size={18} /> Towers</p>
          <strong>{projectTowers}</strong>
          <small>Blocks / Wings</small>
        </div>
      </div>

      {/* Page-level "Advisor's read" AI analysis button & card directly under stats bar */}
      <AdvisorReadCard propertyId={propertyId} />
      <StandoutAIAnalysis propertyId={propertyId} city={property?.city || 'Hyderabad'} />
    </div>

    {/* Sticky Section Navigation */}
    <nav className="section-nav" aria-label="Property sections">
      <div>
        {SECTIONS.map((sec) => (
          <a
            key={sec.id}
            href={`#${sec.id}`}
            className={activeSection === sec.id ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              scrollToSection(sec.id);
            }}
          >
            {sec.label}
          </a>
        ))}
      </div>
    </nav>

    {/* Main Two-Column Continuous Dashboard Container */}
    <div className="page-container columns mt-8">
      {/* Left Column: All 9 Modules in Vertical Sequence */}
      <div className="main-column">

        {/* ======================================================== */}
        {/* SECTION 1: NEIGHBOURHOOD                                 */}
        {/* ======================================================== */}
        <section id="neighbourhood" className="neighbourhood">
          <div className="space-y-1 mb-6">
            <h2 className="text-2xl font-heading font-bold text-[#111111]">Neighbourhood</h2>
            <p className="text-xs text-[#5c5c5c]">
              Everything you need day to day, and how far each place is from the main gate.
            </p>
          </div>

          {/* Category Pills */}
          <div className="pills categories mb-6 overflow-x-auto">
            {Object.keys(PLACES_DATA).map((cat) => (
              <button
                key={cat}
                type="button"
                className={`pill ${selectedCategory === cat ? 'is-selected' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Place Cards Grid */}
          <div className="place-cards">
            {displayedPlaces.map(([name, subtitle, distance]) => (
              <article key={name} className="place-card">
                <div className="place-copy">
                  <h3 title={name}>{name}</h3>
                  <p>{subtitle}</p>
                </div>
                <div className="distance">
                  <div>
                    <strong>{distance}</strong>
                    <span>km</span>
                  </div>
                  <small>from project</small>
                </div>
              </article>
            ))}
          </div>

          <SectionAIAnalysis
            propertyId={propertyId}
            sectionId="neighbourhood"
            onAskFollowUp={handleAskFollowUp}
          />
        </section>

        {/* ======================================================== */}
        {/* SECTION 2: LIVEABILITY                                   */}
        {/* ======================================================== */}
        <section id="liveability" className="liveability">
          <div className="space-y-1 mb-6">
            <h2 className="text-2xl font-heading font-bold text-[#111111]">Liveability</h2>
            <p className="text-xs text-[#5c5c5c]">
              What daily life around the project feels like: parks, footpaths, cycling, safety, noise and air.
            </p>
          </div>

          <div className="liveability-grid">
            {LIVEABILITY_DATA.map(([title, verdict, rating, filledCount, source]) => (
              <article key={title} className="meter-card">
                <h3 title={title}>{title}</h3>
                <p className="verdict">{verdict}</p>
                <p className="rating">{rating}</p>
                <div className="meter" aria-label={`${filledCount} of 5 indicators`}>
                  {[0, 1, 2, 3, 4].map((idx) => (
                    <span key={idx} className={idx < filledCount ? 'filled' : ''} />
                  ))}
                </div>
                <p className="source">{source}</p>
              </article>
            ))}
          </div>

          <SectionAIAnalysis
            propertyId={propertyId}
            sectionId="liveability"
            onAskFollowUp={handleAskFollowUp}
          />
        </section>

        {/* ======================================================== */}
        {/* SECTION 3: MY COMMUTE                                    */}
        {/* ======================================================== */}
        <section id="commute" className="commute">
          <div className="space-y-1 mb-6">
            <h2 className="text-2xl font-heading font-bold text-[#111111]">My Commute</h2>
            <p className="text-xs text-[#5c5c5c]">
              Add the places you go to often and see how long each one takes from this project.
            </p>
          </div>

          <div className="commute-grid">
            {COMMUTE_DESTINATIONS.map((dest) => (
              <article key={dest.name} className="commute-card">
                <div className="commute-title">
                  <h3>{dest.name}</h3>
                  <p>{dest.subtitle}</p>
                  <span className="small-tag mt-1">{dest.frequency}</span>
                </div>
                <div className="commute-values">
                  <div>
                    <small>Time</small>
                    <p><strong>{dest.time}</strong> mins</p>
                  </div>
                  <div>
                    <small>Distance</small>
                    <p>{dest.distance} km</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 p-4 rounded-xl bg-[#f7f7f7] border border-[#e6e6e6] flex items-center justify-between">
            <p className="text-xs text-[#5c5c5c]">
              Travel times calculated with live OSRM routing and CPCB traffic telemetry.
            </p>
            <Link to="/commute" className="text-xs font-semibold text-[#10261a] hover:underline flex items-center gap-1">
              Open full Commute Explorer <ArrowRight size={14} />
            </Link>
          </div>

          <SectionAIAnalysis
            propertyId={propertyId}
            sectionId="commute"
            onAskFollowUp={handleAskFollowUp}
          />
        </section>

        {/* ======================================================== */}
        {/* SECTION 4: MASTER PLAN                                   */}
        {/* ======================================================== */}
        <section id="master-plan" className="master-plan">
          <div className="space-y-1 mb-6">
            <h2 className="text-2xl font-heading font-bold text-[#111111]">Master plan</h2>
            <p className="text-xs text-[#5c5c5c]">
              6 towers around a 16.5-acre central green, with cars kept below ground.
            </p>
          </div>

          {/* Master Images Grid */}
          <div className="master-images">
            <div className="plan-main">
              <img
                src="/design/master-plan.jpeg"
                alt="Site master plan showing the central green and surrounding towers"
              />
              <button
                type="button"
                className="button button--secondary button--compact image-action"
                onClick={() => setMasterPlanModalOpen(true)}
              >
                <Maximize2 size={16} />
                <span>View full plan</span>
              </button>
            </div>

            <div className="plan-renders">
              {[
                { img: '/design/entrance.jpeg', alt: 'Entrance to the apartments' },
                { img: '/design/garden.jpeg', alt: 'Path through the landscaped garden' },
                { img: '/design/clubhouse.jpeg', alt: 'Clubhouse entrance' }
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setGalleryModalOpen(true)}
                  aria-label={`View ${item.alt}`}
                >
                  <img src={item.img} alt={item.alt} />
                </button>
              ))}
            </div>
          </div>

          {/* Highlights */}
          <div className="master-points">
            <article>
              <img className="asset-icon" src="/design/icon-podium.png" alt="" width="40" height="40" />
              <h3>A safe, car-free podium</h3>
              <p>Cars stay underground, so the podium is free for walks, play and gardens.</p>
            </article>
            <article>
              <img className="asset-icon" src="/design/icon-security-story.png" alt="" width="40" height="40" />
              <h3>Checked in, checked out</h3>
              <p>Separate entry and exit gates, each with its own security post.</p>
            </article>
            <article>
              <img className="asset-icon" src="/design/icon-sun-story.png" alt="" width="40" height="40" />
              <h3>Morning light and a breeze</h3>
              <p>Towers face east and north, so homes get natural light and cross-ventilation.</p>
            </article>
          </div>

          {/* Architect Note */}
          <div className="architect-note">
            <p className="eyebrow">Architect’s intent</p>
            <blockquote>“We started with the open space, not the buildings.”</blockquote>
            <div className="architect-caption">
              <div className="architect-person">
                <span className="avatar">KM</span>
                <div>
                  <p>Ar. Kavya Menon</p>
                  <small>Principal architect · Studio Lattice, Bengaluru</small>
                </div>
              </div>
            </div>
          </div>

          <SectionAIAnalysis
            propertyId={propertyId}
            sectionId="master-plan"
            onAskFollowUp={handleAskFollowUp}
          />
        </section>

        {/* ======================================================== */}
        {/* SECTION 5: TOWERS & BLOCKS                               */}
        {/* ======================================================== */}
        <section id="towers" className="towers">
          <div className="space-y-1 mb-6">
            <h2 className="text-2xl font-heading font-bold text-[#111111]">Towers & blocks</h2>
            <p className="text-xs text-[#5c5c5c]">
              6 towers of up to 24 floors. Pick a tower to see its floors, lifts and the homes that face the central green.
            </p>
          </div>

          <div className="tower-grid" role="region" aria-label="Towers and blocks">
            {TOWERS_DATA.map((t) => (
              <article key={t.letter} className="tower-card">
                <div className="tower-plan">
                  <img src="/design/master-plan.jpeg" alt={`Location of Tower ${t.letter}`} />
                  <span className="tower-marker selected">{t.letter}</span>
                </div>
                <div className="tower-info">
                  <div className="tower-title">
                    <h3>Tower {t.letter}</h3>
                    <span className="outline-tag">{t.homes} units</span>
                  </div>

                  <dl className="fact-rows">
                    <div><dt>Floors</dt><dd>{t.floors}</dd></div>
                    <div><dt>Units per floor</dt><dd>{t.unitsPerFloor}</dd></div>
                    <div><dt>Passenger lifts</dt><dd>{t.lifts}</dd></div>
                    <div><dt>Service lifts</dt><dd>2</dd></div>
                    <div><dt>Visitor parking</dt><dd>Yes</dd></div>
                    <div><dt>Basement</dt><dd>Podium above</dd></div>
                  </dl>

                  <button
                    type="button"
                    className="button button--secondary button--compact floor-plans-button"
                    onClick={() => setFloorModalUnit(UNITS_DATA[0])}
                  >
                    View floor plans →
                  </button>
                </div>
              </article>
            ))}
          </div>

          <SectionAIAnalysis
            propertyId={propertyId}
            sectionId="towers"
            onAskFollowUp={handleAskFollowUp}
          />
        </section>

        {/* ======================================================== */}
        {/* SECTION 6: UNIT PLANS & PRICING                          */}
        {/* ======================================================== */}
        <section id="units" className="unit-section">
          <div className="space-y-1 mb-6">
            <h2 className="text-2xl font-heading font-bold text-[#111111]">Unit plans & pricing</h2>
            <p className="text-xs text-[#5c5c5c]">
              3 configurations from 1,300 to 1,880 sq ft. Prices shown are starting prices and change with floor, facing and current offers.
            </p>
          </div>

          {/* Base Price Strip */}
          <div className="price-bar">
            <div>
              <span>Base price</span> <strong>8,600+</strong> <span>/ sq ft</span>
            </div>
            <p><span>Sizes</span> 1,300 – 1,880 sq ft</p>
            <span className="offer-tag">Book by 31 Dec: no floor-rise charges</span>
          </div>

          {/* Configuration Filter Pills */}
          <div className="pills unit-filters my-6">
            <button
              type="button"
              className={`pill ${selectedUnitBhk === 'all' ? 'is-selected' : ''}`}
              onClick={() => setSelectedUnitBhk('all')}
            >
              All units
            </button>
            <button
              type="button"
              className={`pill ${selectedUnitBhk === 2 ? 'is-selected' : ''}`}
              onClick={() => setSelectedUnitBhk(2)}
            >
              2 BHK
            </button>
            <button
              type="button"
              className={`pill ${selectedUnitBhk === 3 ? 'is-selected' : ''}`}
              onClick={() => setSelectedUnitBhk(3)}
            >
              3 BHK
            </button>
          </div>

          {/* Unit Cards Grid */}
          <div className="unit-grid">
            {filteredUnits.map((u) => (
              <article key={u.id} className="unit-card">
                <div className="unit-image">
                  <button
                    type="button"
                    className="plan-open w-full"
                    aria-label={`Open ${u.bhk} BHK ${u.facing} facing floor plan`}
                    onClick={() => setFloorModalUnit(u)}
                  >
                    <img src={u.image} alt={`${u.bhk} BHK ${u.facing} facing floor plan`} />
                  </button>
                </div>
                <div className="unit-info">
                  <p>{u.bhk} BHK · {u.facing} facing</p>
                  <h3>{u.size} sq ft · ₹{u.price} Cr+</h3>
                  <p className="muted">In Tower {u.towers}</p>

                  <dl className="fact-rows">
                    <div><dt>Carpet area</dt><dd>{u.facts[0]} sq ft</dd></div>
                    <div><dt>Balcony</dt><dd>{u.facts[1]} sq ft</dd></div>
                    <div><dt>Common area share</dt><dd>{u.facts[2]} sq ft</dd></div>
                    <div><dt>Undivided land share</dt><dd>{u.facts[3]} sq ft</dd></div>
                  </dl>
                </div>
              </article>
            ))}
          </div>

          {/* CTA Bar */}
          <div className="cta-bar mt-6">
            <div>
              <h3>Prices depend on floor, facing and current offers</h3>
              <p>Tell us which homes you like and Ramky Estates will call you with today’s best price.</p>
            </div>
            <button
              type="button"
              className="button button--primary"
              onClick={() => setContactModalOpen(true)}
            >
              Talk to the developer
            </button>
          </div>

          <SectionAIAnalysis
            propertyId={propertyId}
            sectionId="units"
            onAskFollowUp={handleAskFollowUp}
          />
        </section>

        {/* ======================================================== */}
        {/* SECTION 7: AMENITIES                                     */}
        {/* ======================================================== */}
        <section id="amenities" className="amenities">
          <div className="space-y-1 mb-6">
            <h2 className="text-2xl font-heading font-bold text-[#111111]">Amenities</h2>
            <p className="text-xs text-[#5c5c5c]">
              Everything you can use every day without stepping outside the gates.
            </p>
          </div>

          {/* Clubhouse Banner */}
          <div className="info-banner clubhouse-banner">
            <div>
              <h3>Clubhouse · 40,000 sq ft</h3>
              <p>Three floors, with most indoor amenities under one roof.</p>
            </div>
            <button
              type="button"
              className="button button--secondary button--compact"
              onClick={() => setGalleryModalOpen(true)}
            >
              View clubhouse plan
            </button>
          </div>

          {/* Amenity Filter Pills */}
          <div className="pills amenity-filters my-6">
            {(['All', 'Indoor', 'Outdoor'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                className={`pill ${amenityFilter === filter ? 'is-selected' : ''}`}
                onClick={() => setAmenityFilter(filter)}
              >
                {filter} {filter === 'All' ? AMENITIES_DATA.length : AMENITIES_DATA.filter(a => a.type === filter).length}
              </button>
            ))}
          </div>

          {/* Features Grid with original icons */}
          <div className="features-grid">
            {filteredAmenities.map((item) => (
              <div key={item.name} className="feature-row amenity-row">
                <img
                  className="asset-icon"
                  src={`/design/icon-${item.icon}.png`}
                  alt=""
                  width="40"
                  height="40"
                />
                <div className="feature-copy">
                  <span className="small-tag">{item.type}</span>
                  <h3>{item.name}</h3>
                  <p>{item.location}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="view-all mt-4">
            <button
              type="button"
              className="button button--secondary button--compact"
              onClick={() => setViewAllAmenities(!viewAllAmenities)}
            >
              {viewAllAmenities ? 'Show fewer amenities' : `View all ${AMENITIES_DATA.length} amenities`}
            </button>
          </div>

          <SectionAIAnalysis
            propertyId={propertyId}
            sectionId="amenities"
            onAskFollowUp={handleAskFollowUp}
          />
        </section>

        {/* ======================================================== */}
        {/* SECTION 8: SUSTAINABILITY                                */}
        {/* ======================================================== */}
        <section id="sustainability" className="sustainability">
          <div className="space-y-1 mb-6">
            <h2 className="text-2xl font-heading font-bold text-[#111111]">
              Sustainability & smart infrastructure
            </h2>
            <p className="text-xs text-[#5c5c5c]">
              Features that lower running costs and the project’s footprint, and the smart systems built into the homes.
            </p>
          </div>

          {/* IGBC Platinum Banner */}
          <div className="info-banner certification">
            <div>
              <h3>IGBC Platinum Pre-certified</h3>
              <p>Designed for 15% lower energy demand and 100% wastewater recycling on site.</p>
            </div>
            <button
              type="button"
              className="button button--secondary button--compact"
              onClick={() => alert('IGBC Platinum Pre-Certification ID: GH22P1488. Verified compliance.')}
            >
              View certificate
            </button>
          </div>

          <p className="feature-count my-4">
            {SUSTAINABILITY_DATA.filter(f => !f.unavailable).length} of {SUSTAINABILITY_DATA.length} features
          </p>

          {/* Features Grid */}
          <div className="features-grid">
            {SUSTAINABILITY_DATA.map((item) => (
              <div
                key={item.name}
                className={`feature-row ${item.unavailable ? 'is-unavailable' : ''}`}
              >
                <img
                  className="asset-icon"
                  src={`/design/icon-${item.icon}.png`}
                  alt=""
                  width="40"
                  height="40"
                />
                <div className="feature-copy">
                  <h3>{item.name}</h3>
                  <p>
                    <span>{item.unavailable ? '−' : '✓'}</span>{' '}
                    {item.unavailable ? 'Not in this project' : 'Available'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <SectionAIAnalysis
            propertyId={propertyId}
            sectionId="sustainability"
            onAskFollowUp={handleAskFollowUp}
          />
        </section>

        {/* ======================================================== */}
        {/* SECTION 9: SAFETY & SECURITY                             */}
        {/* ======================================================== */}
        <section id="safety" className="safety">
          <div className="space-y-1 mb-6">
            <h2 className="text-2xl font-heading font-bold text-[#111111]">Safety & security</h2>
            <p className="text-xs text-[#5c5c5c]">
              How the project is guarded, monitored and prepared for emergencies.
            </p>
          </div>

          {/* Fire NOC Banner */}
          <div className="info-banner certification">
            <div>
              <h3>Telangana State Fire Services NOC</h3>
              <p>Multi-stairwell pressurized cores, automated sprinkler network and 100% compliance.</p>
            </div>
            <button
              type="button"
              className="button button--secondary button--compact"
              onClick={() => alert('Telangana Fire Safety NOC Ref: TSFS-2024-HYD-0418. Validated.')}
            >
              View certificate
            </button>
          </div>

          <p className="feature-count my-4">
            {SAFETY_DATA.filter(f => !f.unavailable).length} of {SAFETY_DATA.length} features
          </p>

          {/* Features Grid */}
          <div className="features-grid">
            {SAFETY_DATA.map((item) => (
              <div
                key={item.name}
                className={`feature-row ${item.unavailable ? 'is-unavailable' : ''}`}
              >
                <img
                  className="asset-icon"
                  src={`/design/icon-${item.icon}.png`}
                  alt=""
                  width="40"
                  height="40"
                />
                <div className="feature-copy">
                  <h3>{item.name}</h3>
                  <p>
                    <span>{item.unavailable ? '−' : '✓'}</span>{' '}
                    {item.unavailable ? 'Not in this project' : 'Available'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <SectionAIAnalysis
            propertyId={propertyId}
            sectionId="safety"
            onAskFollowUp={handleAskFollowUp}
          />
        </section>

      </div>

      {/* ======================================================== */}
      {/* RIGHT COLUMN: STICKY PROJECT CARD & SYSTEM B TRIGGER     */}
      {/* ======================================================== */}
      <aside className="sidebar">
        <article className="project-card">
          <img
            className="project-image"
            src="/design/project.jpeg"
            alt="Exterior of Ramky Kingston Park Orbit"
          />
          <div className="project-card-content space-y-3">
            <span className="logo-placeholder">Ramky Estates</span>
            <h3>Ramky Kingston Park Orbit</h3>
            <p>by Ramky Estates</p>
            <div className="pt-2 space-y-2">
              <button
                type="button"
                className="button button--primary w-full"
                onClick={() => setContactModalOpen(true)}
              >
                <PhoneCall size={16} />
                <span>Talk to the developer</span>
              </button>

              <button
                type="button"
                className="button button--secondary w-full"
                onClick={() => setIsSaved(!isSaved)}
              >
                <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                <span>{isSaved ? 'Project saved' : 'Save project'}</span>
              </button>

              <button
                type="button"
                className="w-full py-2.5 px-3 rounded-lg bg-[#eef7f1] text-[#1e6b3a] font-semibold text-xs border border-[#bfddc9] hover:bg-[#8bcaa0]/20 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                onClick={() => setAiAssistantOpen(true)}
              >
                <Bot size={16} />
                <span>Ask Property Intelligence Agent</span>
              </button>
            </div>
          </div>
        </article>
      </aside>
    </div>

    {/* ======================================================== */}
    {/* FLOATING PROPERTY INTELLIGENCE AGENT DRAWER TRIGGER       */}
    {/* ======================================================== */}
    <div className="fixed bottom-6 right-6 z-50">
      <button
        type="button"
        onClick={() => setAiAssistantOpen(true)}
        className="px-5 py-3 rounded-full bg-[#10261a] hover:bg-[#1e6b3a] text-white text-xs font-semibold shadow-lg border border-[#8bcaa0]/40 flex items-center gap-2.5 transition-all hover:scale-105 cursor-pointer"
      >
        <span className="w-5 h-5 rounded-full bg-[#8bcaa0] text-[#10261a] flex items-center justify-center font-bold text-[10px]">
          AI
        </span>
        <span>Ask Property Intelligence Agent</span>
      </button>
    </div>

    {/* ======================================================== */}
    {/* MODAL 1: FLOOR PLAN VIEWER (dialog--floor)               */}
    {/* ======================================================== */}
    {floorModalUnit && (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-[#eee]">
            <div>
              <h2 className="text-xl font-heading font-bold text-[#111111]">
                {floorModalUnit.bhk} BHK · {floorModalUnit.facing} facing
              </h2>
              <p className="text-xs text-[#5c5c5c]">
                Ramky Kingston Park Orbit · Tower {floorModalUnit.towers}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFloorModalUnit(null)}
              className="p-2 text-[#767676] hover:text-[#111111]"
            >
              <X size={20} />
            </button>
          </div>

          <div className="rounded-xl overflow-hidden border border-[#eee] bg-[#f7f7f7] p-2">
            <img
              src={floorModalUnit.image}
              alt={`${floorModalUnit.bhk} BHK Floor Plan`}
              className="w-full h-auto max-h-80 object-contain mx-auto"
            />
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 bg-[#f7f7f7] rounded-lg">
              <dt className="text-[10px] text-[#767676] uppercase font-mono">Super built-up</dt>
              <dd className="text-sm font-bold text-[#111]">{floorModalUnit.size} sq ft</dd>
            </div>
            <div className="p-3 bg-[#f7f7f7] rounded-lg">
              <dt className="text-[10px] text-[#767676] uppercase font-mono">Carpet area</dt>
              <dd className="text-sm font-bold text-[#111]">{floorModalUnit.facts[0]} sq ft</dd>
            </div>
            <div className="p-3 bg-[#eef7f1] rounded-lg">
              <dt className="text-[10px] text-[#1e6b3a] uppercase font-mono font-bold">Efficiency ratio</dt>
              <dd className="text-sm font-bold text-[#1e6b3a]">69.0%</dd>
            </div>
            <div className="p-3 bg-[#f7f7f7] rounded-lg">
              <dt className="text-[10px] text-[#767676] uppercase font-mono">Starting price</dt>
              <dd className="text-sm font-bold text-[#111]">₹{floorModalUnit.price} Cr</dd>
            </div>
          </dl>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eee]">
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setFloorModalUnit(null)}
            >
              Close
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => {
                setFloorModalUnit(null);
                setContactModalOpen(true);
              }}
            >
              Talk to developer
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ======================================================== */}
    {/* MODAL 2: GALLERY VIEWER                                  */}
    {/* ======================================================== */}
    {galleryModalOpen && (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-[#eee]">
            <div>
              <h2 className="text-lg font-heading font-bold text-[#111111]">Project Gallery</h2>
              <p className="text-xs text-[#5c5c5c]">Ramky Kingston Park Orbit · 4 reference photos</p>
            </div>
            <button
              type="button"
              onClick={() => setGalleryModalOpen(false)}
              className="p-2 text-[#767676] hover:text-[#111111]"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { src: '/design/hero.jpeg', label: 'Landscaped Courtyard & Podium' },
              { src: '/design/clubhouse.jpeg', label: 'Clubhouse Entrance & Terraces' },
              { src: '/design/entrance.jpeg', label: 'Grand Entrance & Security Check' },
              { src: '/design/garden.jpeg', label: 'Central Green Promenade' }
            ].map((img, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-[#dedede] bg-slate-50">
                <img src={img.src} alt={img.label} className="w-full h-48 object-cover" />
                <p className="p-3 text-xs font-semibold text-[#111111]">{img.label}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-[#eee]">
            <button
              type="button"
              className="button button--primary"
              onClick={() => setGalleryModalOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ======================================================== */}
    {/* MODAL 3: FULL MASTER PLAN MODAL                          */}
    {/* ======================================================== */}
    {masterPlanModalOpen && (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-[#eee]">
            <div>
              <h2 className="text-xl font-heading font-bold text-[#111111]">Full Master Plan</h2>
              <p className="text-xs text-[#5c5c5c]">16.5 Acres · 68% Green Cover · 6 Residential Towers</p>
            </div>
            <button
              type="button"
              onClick={() => setMasterPlanModalOpen(false)}
              className="p-2 text-[#767676] hover:text-[#111111]"
            >
              <X size={20} />
            </button>
          </div>

          <div className="rounded-xl overflow-hidden border border-[#eee] bg-slate-900">
            <img
              src="/design/master-plan.jpeg"
              alt="Full Master Plan"
              className="w-full h-auto max-h-[70vh] object-contain mx-auto"
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-[#eee]">
            <button
              type="button"
              className="button button--primary"
              onClick={() => setMasterPlanModalOpen(false)}
            >
              Close Plan
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ======================================================== */}
    {/* MODAL 4: CONTACT DEVELOPER FORM                          */}
    {/* ======================================================== */}
    {contactModalOpen && (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#eee]">
            <div>
              <h2 className="text-lg font-heading font-bold text-[#111111]">Talk to the developer</h2>
              <p className="text-xs text-[#5c5c5c]">Ramky Estates sales desk</p>
            </div>
            <button
              type="button"
              onClick={() => setContactModalOpen(false)}
              className="p-2 text-[#767676] hover:text-[#111111]"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert('Thank you! Ramky Estates sales desk has received your request and will call you shortly.');
              setContactModalOpen(false);
            }}
            className="space-y-3 text-xs"
          >
            <div>
              <label className="font-semibold block mb-1">Your Full Name</label>
              <input
                type="text"
                defaultValue={user?.full_name || 'Akshay'}
                required
                className="w-full p-2.5 rounded-lg border border-[#ddd] focus:outline-none focus:border-[#10261a]"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Mobile Number</label>
              <input
                type="tel"
                defaultValue="+91 98765 43210"
                required
                className="w-full p-2.5 rounded-lg border border-[#ddd] focus:outline-none focus:border-[#10261a]"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Interested Configuration</label>
              <select className="w-full p-2.5 rounded-lg border border-[#ddd] focus:outline-none focus:border-[#10261a] bg-white">
                <option>2 BHK (1,300 sq ft) — starting ₹1.12 Cr</option>
                <option>3 BHK (1,880 sq ft) — starting ₹1.62 Cr</option>
                <option>Both / Looking for best offer</option>
              </select>
            </div>
            <div>
              <label className="font-semibold block mb-1">Message or Query</label>
              <textarea
                rows={3}
                placeholder="Ask for current floor rise offers, site visit or brochure..."
                defaultValue="Hi, I am interested in Ramky Kingston Park Orbit. Please share the latest availability and schedule a site visit."
                className="w-full p-2.5 rounded-lg border border-[#ddd] focus:outline-none focus:border-[#10261a]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#eee]">
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setContactModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="button button--primary">
                Submit Request
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* ======================================================== */}
    {/* MODAL 5: SYSTEM B PLATFORM-WIDE AI RESEARCH ADVISOR      */}
    {/* ======================================================== */}
    {aiAssistantOpen && (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-end">
        <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col">
          <div className="p-4 bg-[#10261a] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-[#1e6b3a] text-[#8bcaa0] flex items-center justify-center font-bold">
                <Bot size={18} />
              </span>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Property Intelligence Agent</h3>
                <p className="text-[11px] text-[#8bcaa0]">Deterministic calculation packets & evidence grounding</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAiAssistantOpen(false)}
              className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-hidden p-4">
            <AIAssistantChat
              property={property}
              initialContext={aiAssistantPrompt}
              onClose={() => setAiAssistantOpen(false)}
            />
          </div>
        </div>
      </div>
    )}
  </div>
);
};
