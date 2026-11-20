import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  MapPin,
  Save,
  CheckCircle,
  AlertCircle,
  Upload,
  Calendar,
  Layers,
  Home,
  Check,
  X,
  Sparkles,
  Info,
  HelpCircle,
  Eye,
  ArrowRight
} from 'lucide-react';

export const BuilderPage: React.FC = () => {
  const navigate = useNavigate();

  // Active Navigation in Sidebar
  const [activeGroup, setActiveGroup] = useState<'project_info_1' | 'project_info_2' | 'unit_level_info' | 'sales_reps'>('project_info_1');
  const [activeSubItem, setActiveSubItem] = useState<string>('project');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ========================================================
  // FORM STATE: PROJECT INFO 1
  // ========================================================
  const [projectName, setProjectName] = useState('Ramky Kingston Park Orbit');
  const [reraNo, setReraNo] = useState('P02400005821');
  const [projectType, setProjectType] = useState('Apartments (APT)');
  const [projectUSP, setProjectUSP] = useState('16.5-acre luxury gated community with 68% central green cover and car-free podium.');
  const [projectOverview, setProjectOverview] = useState('Ultra-premium 2 & 3 BHK residences in Gopanapally, Hyderabad, directly connected to Financial District and Gachibowli.');
  const [city, setCity] = useState('Hyderabad');
  const [area, setArea] = useState('Gopanapally');
  const [address, setAddress] = useState('Survey No. 48/A, Gopanapally X Roads, Financial District Extension, Hyderabad, 500046');
  const [latitude, setLatitude] = useState('17.432500');
  const [longitude, setLongitude] = useState('78.341200');

  // Scale & Density
  const [projectSizeAcres, setProjectSizeAcres] = useState('16.5');
  const [noOfUnits, setNoOfUnits] = useState('1406');
  const [approachRoadWidth, setApproachRoadWidth] = useState('100 feet ORR Link Road');

  // Phases
  const [phases, setPhases] = useState([
    {
      id: 1,
      name: 'Phase 1',
      reraNo: 'P02400005821',
      sizeAcres: '12.5',
      startDate: '2024-06-01',
      possessionDate: '2027-06-30',
      salesStatus: 'Open for Sales',
      phaseStatus: 'Active',
      notes: 'Towers A, B, C, and Clubhouse included in Phase 1 launch.'
    }
  ]);

  // Blocks
  const [blocks, setBlocks] = useState([
    {
      id: 1,
      phase: 'Phase 1',
      name: 'Tower A',
      floors: 24,
      unitsPerFloor: 8,
      passengerLifts: 3,
      serviceLifts: 2,
      refugeFloor: '10, 18',
      visitorParking: true,
      podiumUnderneath: true,
      terrace: true
    },
    {
      id: 2,
      phase: 'Phase 1',
      name: 'Tower B',
      floors: 24,
      unitsPerFloor: 8,
      passengerLifts: 3,
      serviceLifts: 2,
      refugeFloor: '10, 18',
      visitorParking: true,
      podiumUnderneath: true,
      terrace: true
    }
  ]);

  // Pricing
  const [pricingBasis, setPricingBasis] = useState('Super Built-up Area');
  const [floorRisePremium, setFloorRisePremium] = useState('50');
  const [facingPremiumDir, setFacingPremiumDir] = useState('East');
  const [facingPremiumPrice, setFacingPremiumPrice] = useState('100');
  const [viewPremiumType, setViewPremiumType] = useState('Central Green View');
  const [viewPremiumPrice, setViewPremiumPrice] = useState('100');
  const [carParkingType, setCarParkingType] = useState('Covered Basement');
  const [carParkingPrice, setCarParkingPrice] = useState('300000');
  const [corpusFundBasis, setCorpusFundBasis] = useState<'lumpsum' | 'persft'>('persft');
  const [corpusFundAmount, setCorpusFundAmount] = useState('120');
  const [fsiUsed, setFsiUsed] = useState('2.5 permissible (2.35 utilized)');
  const [maintenanceDeposit, setMaintenanceDeposit] = useState('3.5');

  // Special Offer / Media
  const [specialOfferText, setSpecialOfferText] = useState('Early bird festive offer: Zero floor rise charges on selected 3 BHK units.');
  const [specialOfferEndDate, setSpecialOfferEndDate] = useState('2026-12-31');
  const [specialOfferDesc, setSpecialOfferDesc] = useState('Clubhouse view premium included.');

  // Neighborhood / Walkability
  const [metroStations, setMetroStations] = useState([
    { name: 'Jubilee Hills Checkpost', distance: '3.0', coords: '17.4300, 78.4070', notes: 'Blue Line Corridor' },
    { name: 'Peddamma Gudi', distance: '3.5', coords: '17.4320, 78.4010', notes: 'Blue Line Feeder' }
  ]);
  const [busStops, setBusStops] = useState([
    { name: 'Gopanapally X Roads', distance: '0.8', notes: 'TSRTC frequent local connectivity' },
    { name: 'Nallagandla Bus Stop', distance: '1.6', notes: 'Direct lines to Hitec City' }
  ]);
  const [parksNearby, setParksNearby] = useState([
    { name: 'Gopi Cheruvu Lake Park', distance: '2.3', notes: 'Lake promenade & jogging' }
  ]);
  const [footpathCondition, setFootpathCondition] = useState([
    { name: 'Nallagandla Main Road', rating: '3.1 / 5', notes: 'Paved sidewalk with shade trees' }
  ]);

  // ========================================================
  // FORM STATE: PROJECT INFO 2
  // ========================================================
  const [landscapedGreenArea, setLandscapedGreenArea] = useState('44500');
  const [aboutGreenArea, setAboutGreenArea] = useState('Central green promenade with Japanese Zen garden, flower groves and safe car-free walking loops.');
  const [greenAreaStairs, setGreenAreaStairs] = useState<'yes' | 'no'>('yes');

  // Indoor Amenities State
  const [indoorAmenities, setIndoorAmenities] = useState({
    multipurposeHall: { available: true, desc: '40,000 sq ft clubhouse banquet with stage & pantry', floor: 'Clubhouse, 2nd floor' },
    indoorGym: { available: true, desc: 'Fully equipped cardio & weight training studio with certified trainers', floor: 'Clubhouse, 1st floor' },
    gamesRoom: { available: true, desc: 'Table tennis, snooker, foosball and chess lounge', floor: 'Clubhouse, Ground floor' },
    coWorking: { available: true, desc: 'High-speed fiber workstations, meeting pods and conference room', floor: 'Clubhouse, 1st floor' }
  });

  // Areas from Master Plan
  const [totalBuiltUpArea, setTotalBuiltUpArea] = useState('165000');
  const [totalSetbackArea, setTotalSetbackArea] = useState('12.5 meters peripheral all sides');
  const [drivewaysArea, setDrivewaysArea] = useState('Two-lane peripheral access road connecting to basement ramps');

  // Sustainability & Smart Infrastructure
  const [sustainability, setSustainability] = useState({
    solarPower: '120 kWp rooftop solar PV arrays for common area lighting',
    rainwater: '14 recharge pits across site with 2,50,000 litres storage capacity',
    stp: '100% capacity STP with tertiary filtration for landscaping and flushing',
    evCharging: '12 dedicated fast EV charging bays in basement'
  });

  // ========================================================
  // FORM STATE: UNIT LEVEL INFO
  // ========================================================
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [selectedArchetypes, setSelectedArchetypes] = useState<string[]>([
    'Living', 'Dining', 'Kitchen', 'Bedrooms', 'Toilets', 'Balcony', 'Utility'
  ]);

  const allArchetypes = [
    'Living', 'Dining', 'Kitchen', 'Utility', 'Bedrooms', 'Toilets',
    'Study', 'Balcony', 'Foyer', 'Store', 'Helper Room', 'Mud Room', 'Pooja', 'Special'
  ];

  const toggleArchetype = (arch: string) => {
    setSelectedArchetypes(prev =>
      prev.includes(arch) ? prev.filter(a => a !== arch) : [...prev, arch]
    );
  };

  const handleAddPhase = () => {
    const newId = phases.length + 1;
    setPhases(prev => [
      ...prev,
      {
        id: newId,
        name: `Phase ${newId}`,
        reraNo: '',
        sizeAcres: '',
        startDate: '',
        possessionDate: '',
        salesStatus: 'Open for Sales',
        phaseStatus: 'Upcoming',
        notes: ''
      }
    ]);
    showToast(`Added Phase ${newId}`);
  };

  const handleAddBlock = () => {
    const nextLetter = String.fromCharCode(65 + blocks.length);
    const newId = blocks.length + 1;
    setBlocks(prev => [
      ...prev,
      {
        id: newId,
        phase: 'Phase 1',
        name: `Tower ${nextLetter}`,
        floors: 24,
        unitsPerFloor: 8,
        passengerLifts: 3,
        serviceLifts: 2,
        refugeFloor: '10, 18',
        visitorParking: true,
        podiumUnderneath: true,
        terrace: true
      }
    ]);
    showToast(`Added Tower ${nextLetter}`);
  };

  const handleSave = () => {
    showToast('Saved successfully! All property data has been synchronized.');
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] flex flex-col font-sans">
      {/* ======================================================== */}
      {/* TOP NAVBAR MATCHING IMAGES                               */}
      {/* ======================================================== */}
      <header className="w-full bg-white border-b border-[#dedede] h-16 px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-heading text-2xl font-bold tracking-tight text-[#111111]">
            Dashboard
          </Link>

          {/* Search bar matching Image 1 */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f7f7f7] border border-[#e6e6e6] text-xs text-[#767676] w-64">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-0 outline-none w-full text-xs text-[#111111]"
            />
          </div>
        </div>

        {/* Top Right User Profile Badge matching Image 1 */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="w-9 h-9 rounded-xl border border-[#dedede] flex items-center justify-center text-[#5c5c5c] hover:bg-[#f7f7f7] transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2"></span>
          </button>

          <div className="flex items-center gap-2.5 pl-2 border-l border-[#eee]">
            <span className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              B
            </span>
            <div className="hidden md:block text-left text-xs">
              <strong className="block text-[#111111] font-semibold leading-tight">builder@yopmail.com</strong>
              <small className="text-[#767676] block text-[11px]">Developer</small>
            </div>
            <ChevronDown size={14} className="text-[#767676]" />
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-lg bg-[#10261a] text-white text-xs font-semibold shadow-lg border border-[#bfddc9] flex items-center gap-2 animate-bounce">
          <CheckCircle size={15} className="text-[#8bcaa0]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Title Header matching Image 1 */}
      <div className="px-8 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold font-heading text-[#111111]">
            Create Property
          </h1>
          <div className="flex items-center gap-2">
            <Link
              to="/properties/1"
              target="_blank"
              className="px-3 py-1.5 rounded-md border border-[#ddd] bg-white text-xs font-semibold text-[#111] hover:bg-[#f7f7f7] flex items-center gap-1.5 transition-colors"
            >
              <Eye size={14} />
              <span>Preview Live Portal</span>
            </Link>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Save size={14} />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TWO-COLUMN BUILDER DASHBOARD BODY                        */}
      {/* ======================================================== */}
      <div className="flex-1 flex max-w-full overflow-hidden px-8 py-4 gap-6">

        {/* LEFT SIDEBAR: Property Details Navigation */}
        <aside
          className={`bg-white rounded-xl border border-[#dedede] transition-all flex flex-col relative shadow-2xs ${
            sidebarCollapsed ? 'w-16' : 'w-72'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-[#eee]">
            {!sidebarCollapsed ? (
              <>
                <h3 className="font-semibold text-xs text-[#111111] mb-2">Property Details</h3>
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#f7f7f7] border border-[#e6e6e6] text-xs text-[#767676]">
                  <Search size={13} />
                  <input
                    type="text"
                    placeholder="Search"
                    className="bg-transparent border-0 outline-none w-full text-xs"
                  />
                </div>
              </>
            ) : (
              <Building2 size={20} className="mx-auto text-indigo-600" />
            )}
          </div>

          {/* Toggle Button on vertical green divider line matching Image 1 */}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-6 h-6 rounded-full bg-amber-400 hover:bg-amber-500 text-white flex items-center justify-center absolute -right-3 top-16 shadow-md z-20 cursor-pointer text-[10px] font-bold"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '›' : '‹'}
          </button>

          {/* Navigation Accordion Items */}
          <div className="flex-1 overflow-y-auto py-2 text-xs">
            {/* GROUP 1: Project Info 1 */}
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setActiveGroup(activeGroup === 'project_info_1' ? ('' as any) : 'project_info_1')}
                className={`w-full px-3 py-2 flex items-center justify-between text-left font-medium transition-colors cursor-pointer ${
                  activeGroup === 'project_info_1'
                    ? 'border-l-4 border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold'
                    : 'text-[#5c5c5c] hover:bg-[#f7f7f7]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Building2 size={16} className="text-indigo-600 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Project Info 1</span>}
                </div>
                {!sidebarCollapsed && (
                  activeGroup === 'project_info_1' ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                )}
              </button>

              {!sidebarCollapsed && activeGroup === 'project_info_1' && (
                <div className="pl-8 pr-3 py-1 space-y-1">
                  {[
                    { id: 'project', label: 'Project' },
                    { id: 'scale_density', label: 'Scale & Density' },
                    { id: 'status_ownership', label: 'Project Status & Ownership' },
                    { id: 'phases', label: 'Phases' },
                    { id: 'blocks', label: 'Blocks' },
                    { id: 'pricing', label: 'Pricing' },
                    { id: 'media', label: 'Media' },
                    { id: 'neighborhood', label: 'Neighborhood/Walkability' },
                    { id: 'summary', label: '📊 View Summary' }
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setActiveSubItem(sub.id)}
                      className={`w-full text-left py-1.5 px-2 rounded-md flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        activeSubItem === sub.id
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-[#5c5c5c] hover:text-[#111111] hover:bg-[#f7f7f7]'
                      }`}
                    >
                      <span className="truncate">{sub.label}</span>
                      {activeSubItem === sub.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* GROUP 2: Project Info 2 */}
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setActiveGroup(activeGroup === 'project_info_2' ? ('' as any) : 'project_info_2')}
                className={`w-full px-3 py-2 flex items-center justify-between text-left font-medium transition-colors cursor-pointer ${
                  activeGroup === 'project_info_2'
                    ? 'border-l-4 border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold'
                    : 'text-[#5c5c5c] hover:bg-[#f7f7f7]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Layers size={16} className="text-indigo-600 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Project Info 2</span>}
                </div>
                {!sidebarCollapsed && (
                  activeGroup === 'project_info_2' ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                )}
              </button>

              {!sidebarCollapsed && activeGroup === 'project_info_2' && (
                <div className="pl-8 pr-3 py-1 space-y-1">
                  {[
                    { id: 'open_space', label: 'Open Space & Landscaping' },
                    { id: 'indoor_amenities', label: 'Indoor Amenities' },
                    { id: 'master_plan_areas', label: 'Areas from Master Plan' },
                    { id: 'sustainability', label: 'Sustainability & Smart Infrastructure' },
                    { id: 'outdoor_amenities', label: 'Outdoor Amenities' },
                    { id: 'cycling', label: 'Cycling Infrastructure' },
                    { id: 'safety_security', label: 'Safety & Security Features' }
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setActiveSubItem(sub.id)}
                      className={`w-full text-left py-1.5 px-2 rounded-md flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        activeSubItem === sub.id
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-[#5c5c5c] hover:text-[#111111] hover:bg-[#f7f7f7]'
                      }`}
                    >
                      <span className="truncate">{sub.label}</span>
                      {activeSubItem === sub.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* GROUP 3: Unit Level Info */}
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setActiveGroup(activeGroup === 'unit_level_info' ? ('' as any) : 'unit_level_info')}
                className={`w-full px-3 py-2 flex items-center justify-between text-left font-medium transition-colors cursor-pointer ${
                  activeGroup === 'unit_level_info'
                    ? 'border-l-4 border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold'
                    : 'text-[#5c5c5c] hover:bg-[#f7f7f7]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Home size={16} className="text-indigo-600 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Unit Level Info</span>}
                </div>
                {!sidebarCollapsed && (
                  activeGroup === 'unit_level_info' ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                )}
              </button>

              {!sidebarCollapsed && activeGroup === 'unit_level_info' && (
                <div className="pl-8 pr-3 py-1 space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveSubItem('unit_configuration')}
                    className={`w-full text-left py-1.5 px-2 rounded-md flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      activeSubItem === 'unit_configuration'
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-[#5c5c5c] hover:text-[#111111] hover:bg-[#f7f7f7]'
                    }`}
                  >
                    <span className="truncate">Unit Configuration</span>
                    {activeSubItem === 'unit_configuration' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* RIGHT MAIN WORKSPACE: FORM FIELDS MATCHING IMAGES        */}
        {/* ======================================================== */}
        <main className="flex-1 bg-white rounded-xl border border-[#dedede] p-6 overflow-y-auto shadow-2xs">

          {/* -------------------------------------------------------- */}
          {/* 1. PROJECT (Images 1 & 2)                                */}
          {/* -------------------------------------------------------- */}
          {activeSubItem === 'project' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-base font-bold font-heading text-[#111111]">Project Info</h2>
              </div>

              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#333]">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., Sunshine Residency"
                    className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#333]">
                    RERA Approve No
                  </label>
                  <input
                    type="text"
                    value={reraNo}
                    onChange={(e) => setReraNo(e.target.value)}
                    placeholder="e.g., 1234"
                    className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#333]">
                    Project Type
                  </label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs focus:outline-none focus:border-indigo-600 bg-white"
                  >
                    <option>Select Property Type</option>
                    <option>Apartments (APT)</option>
                    <option>Villa (VIL)</option>
                    <option>Plotted Development (PLT)</option>
                    <option>Commercial/Office (COM)</option>
                    <option>Retail/Mall (RET)</option>
                    <option>Mixed Use (MIX)</option>
                    <option>Senior/Assisted Living (SEN)</option>
                    <option>Co-living/Serviced Apartments (COL)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: USP */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#333]">
                  Project USP *
                </label>
                <textarea
                  rows={2}
                  value={projectUSP}
                  onChange={(e) => setProjectUSP(e.target.value)}
                  placeholder="Enter project USP..."
                  className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Row 3: Overview */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-[#333]">
                  Project Overview *
                </label>
                <textarea
                  rows={3}
                  value={projectOverview}
                  onChange={(e) => setProjectOverview(e.target.value)}
                  placeholder="Enter project overview..."
                  className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Location Section matching Image 2 */}
              <div className="pt-4 border-t border-[#eee]">
                <h3 className="text-sm font-bold text-[#111111] mb-4">Project Location</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">
                      City *
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs focus:outline-none focus:border-indigo-600 bg-white"
                    >
                      <option>Hyderabad</option>
                      <option>Bengaluru</option>
                      <option>Mumbai</option>
                      <option>Pune</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">
                      Area *
                    </label>
                    <select
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs focus:outline-none focus:border-indigo-600 bg-white"
                    >
                      <option>Gopanapally</option>
                      <option>Kokapet</option>
                      <option>Tellapur</option>
                      <option>Puppalaguda</option>
                      <option>Narsingi</option>
                      <option>Gachibowli</option>
                      <option>Financial District</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-[#333]">
                        Address *
                      </label>
                      <textarea
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Full address"
                        className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-[#333]">
                        Latitude *
                      </label>
                      <input
                        type="text"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="e.g., 17.385000"
                        className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-[#333]">
                        Longitude *
                      </label>
                      <input
                        type="text"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="e.g., 78.486700"
                        className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  {/* Map Coordinate Picker Box matching Image 2 */}
                  <div className="rounded-xl border border-[#ddd] bg-[#f7f7f7] p-4 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={16} className="text-emerald-600" />
                      <strong className="text-xs text-[#111111]">Interactive Coordinate Locator</strong>
                    </div>
                    <div className="bg-white rounded-lg border border-[#e6e6e6] p-3 text-xs space-y-1">
                      <p className="text-slate-600">Selected Pin: <strong>{latitude}, {longitude}</strong></p>
                      <p className="text-[11px] text-slate-400">Gopanapally X Roads · Telanagana RERA Boundary</p>
                    </div>
                    <p className="text-[11px] text-[#767676] mt-2">
                      Coordinates are automatically referenced against OSM Overpass for walkability and CPCB telemetry.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save</span>
                </button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* 2. SCALE & DENSITY (Image 3)                             */}
          {/* -------------------------------------------------------- */}
          {activeSubItem === 'scale_density' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-base font-bold font-heading text-[#111111]">Scale & Density</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#333]">
                    Project Size In Acres *
                  </label>
                  <input
                    type="text"
                    value={projectSizeAcres}
                    onChange={(e) => setProjectSizeAcres(e.target.value)}
                    placeholder="e.g., 5"
                    className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#333]">
                    No. Of Units/Plots
                  </label>
                  <input
                    type="text"
                    value={noOfUnits}
                    onChange={(e) => setNoOfUnits(e.target.value)}
                    placeholder="e.g., 100"
                    className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#333]">
                    Approach Road To Project
                  </label>
                  <input
                    type="text"
                    value={approachRoadWidth}
                    onChange={(e) => setApproachRoadWidth(e.target.value)}
                    placeholder="e.g., 40 feet"
                    className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save</span>
                </button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* 3. PHASES (Images 4 & 5)                                 */}
          {/* -------------------------------------------------------- */}
          {activeSubItem === 'phases' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-heading text-[#111111]">Project Phases</h2>
                  <p className="text-xs text-[#767676]">Manage project phases and their details</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddPhase}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus size={14} />
                  <span>+ Add Phase</span>
                </button>
              </div>

              {phases.map((phase) => (
                <div key={phase.id} className="p-5 rounded-xl border border-[#dedede] bg-white space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 border-b border-[#eee]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#111111]">{phase.name}</span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        ● active Phase {phase.id}
                      </span>
                    </div>
                    {phases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPhases(phases.filter(p => p.id !== phase.id))}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete phase"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-[#333]">
                        Phase Name *
                      </label>
                      <input
                        type="text"
                        defaultValue={phase.name}
                        className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-[#333]">
                        Phase Size (Acres)
                      </label>
                      <input
                        type="text"
                        defaultValue={phase.sizeAcres}
                        placeholder="e.g., 12.5"
                        className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-[#333]">
                        RERA No *
                      </label>
                      <input
                        type="text"
                        defaultValue={phase.reraNo}
                        placeholder="1234"
                        className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-[#333]">
                        Phase Status *
                      </label>
                      <select
                        defaultValue={phase.phaseStatus}
                        className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs bg-white"
                      >
                        <option>Active</option>
                        <option>Upcoming</option>
                        <option>Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-[#333]">
                        Tentative Start Date
                      </label>
                      <input
                        type="date"
                        defaultValue={phase.startDate}
                        className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-[#333]">
                        Tentative Possession Date
                      </label>
                      <input
                        type="date"
                        defaultValue={phase.possessionDate}
                        className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-2 text-[#333]">
                      Sales Status *
                    </label>
                    <div className="flex items-center gap-6 text-xs flex-wrap">
                      {['Open for Sales', 'Not Yet Open for Sales', 'Almost Sold', 'Sold'].map((status) => (
                        <label key={status} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`sales_status_${phase.id}`}
                            defaultChecked={phase.salesStatus === status}
                          />
                          <span>{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">
                      Additional Notes
                    </label>
                    <textarea
                      rows={2}
                      defaultValue={phase.notes}
                      placeholder="Any additional notes..."
                      className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save All Phases</span>
                </button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* 4. BLOCKS (Images 6 & 7)                                 */}
          {/* -------------------------------------------------------- */}
          {activeSubItem === 'blocks' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-heading text-[#111111]">Project Blocks</h2>
                  <p className="text-xs text-[#767676]">Manage project blocks and their configurations</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddBlock}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus size={14} />
                  <span>+ Add Block</span>
                </button>
              </div>

              {blocks.map((block) => (
                <div key={block.id} className="p-5 rounded-xl border border-[#dedede] bg-white space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 border-b border-[#eee]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#111111]">{block.name}</span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ✓ saved Block {block.id}
                      </span>
                    </div>
                    {blocks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setBlocks(blocks.filter(b => b.id !== block.id))}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete block"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-[#333]">
                        Phase *
                      </label>
                      <select
                        defaultValue={block.phase}
                        className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs bg-white"
                      >
                        <option>Phase 1</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-[#333]">
                        Block Name *
                      </label>
                      <input
                        type="text"
                        defaultValue={block.name}
                        className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-[#333]">
                        Floor Count *
                      </label>
                      <input
                        type="number"
                        defaultValue={block.floors}
                        onChange={(e) => {
                          const f = parseInt(e.target.value) || 0;
                          setBlocks(blocks.map(b => b.id === block.id ? { ...b, floors: f } : b));
                        }}
                        className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-[#333]">
                        Units per Floor
                      </label>
                      <input
                        type="number"
                        defaultValue={block.unitsPerFloor}
                        onChange={(e) => {
                          const u = parseInt(e.target.value) || 0;
                          setBlocks(blocks.map(b => b.id === block.id ? { ...b, unitsPerFloor: u } : b));
                        }}
                        className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-[#333]">
                        Total Units (auto-calculated)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={block.floors * block.unitsPerFloor}
                        className="w-full p-2.5 rounded-lg border border-[#eee] bg-[#f7f7f7] text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-[#333]">
                        Passenger Lifts
                      </label>
                      <input
                        type="number"
                        defaultValue={block.passengerLifts}
                        placeholder="e.g., 2"
                        className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-[#333]">
                        Service Lifts
                      </label>
                      <input
                        type="number"
                        defaultValue={block.serviceLifts}
                        placeholder="e.g., 1"
                        className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold mb-1 text-[#333]">
                        Refuge Area – Which Floor?
                      </label>
                      <input
                        type="text"
                        defaultValue={block.refugeFloor}
                        placeholder="e.g., 10, F10, L10"
                        className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-2 text-xs flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked={block.visitorParking} />
                      <span>Visitor Parking for this Block</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked={block.podiumUnderneath} />
                      <span>Basement / Podium Underneath</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" defaultChecked={block.terrace} />
                      <span>Terrace Access</span>
                    </label>
                  </div>

                  <div className="p-3 bg-[#f7f7f7] rounded-lg text-xs text-[#5c5c5c]">
                    Summary: <strong>{block.name}</strong> · {block.floors} floors · {block.floors * block.unitsPerFloor} total units
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-4 border-t border-[#eee]">
                <span className="text-xs text-emerald-600 font-medium">All blocks saved</span>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save All Blocks</span>
                </button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* 5. PRICING (Image 8)                                     */}
          {/* -------------------------------------------------------- */}
          {activeSubItem === 'pricing' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-base font-bold font-heading text-[#111111]">Pricing</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-2 text-[#333]">
                    Area In
                  </label>
                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" defaultChecked />
                      <span>SFT</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" />
                      <span>SQM</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#333]">
                    Pricing Basis (Area Type) *
                  </label>
                  <select
                    value={pricingBasis}
                    onChange={(e) => setPricingBasis(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs bg-white"
                  >
                    <option>Super Built-up Area</option>
                    <option>Carpet Area</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#333]">
                    Floor Rise Premium *
                  </label>
                  <input
                    type="text"
                    value={floorRisePremium}
                    onChange={(e) => setFloorRisePremium(e.target.value)}
                    placeholder="Currency per sqft per floor"
                    className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                  />
                </div>
              </div>

              {/* Premiums */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold mb-1 text-[#333]">Facing Premium</label>
                    <input
                      type="text"
                      value={facingPremiumDir}
                      onChange={(e) => setFacingPremiumDir(e.target.value)}
                      placeholder="Direction e.g., North-East"
                      className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-xs font-semibold mb-1 text-[#333]">Price</label>
                    <input
                      type="text"
                      value={facingPremiumPrice}
                      onChange={(e) => setFacingPremiumPrice(e.target.value)}
                      placeholder="₹ / sq ft"
                      className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold mb-1 text-[#333]">View Premium</label>
                    <input
                      type="text"
                      value={viewPremiumType}
                      onChange={(e) => setViewPremiumType(e.target.value)}
                      placeholder="Type e.g., Pool View"
                      className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-xs font-semibold mb-1 text-[#333]">Price</label>
                    <input
                      type="text"
                      value={viewPremiumPrice}
                      onChange={(e) => setViewPremiumPrice(e.target.value)}
                      placeholder="₹ / sq ft"
                      className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Car Parking & Corpus Fund */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold mb-1 text-[#333]">Car Parking</label>
                    <input
                      type="text"
                      value={carParkingType}
                      onChange={(e) => setCarParkingType(e.target.value)}
                      placeholder="Type e.g., Covered"
                      className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                    />
                  </div>
                  <div className="w-36">
                    <label className="block text-xs font-semibold mb-1 text-[#333]">Price</label>
                    <input
                      type="text"
                      value={carParkingPrice}
                      onChange={(e) => setCarParkingPrice(e.target.value)}
                      placeholder="Price"
                      className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#333]">Corpus Fund</label>
                  <div className="flex gap-2">
                    <div className="flex rounded-lg overflow-hidden border border-[#ddd] text-xs">
                      <button
                        type="button"
                        onClick={() => setCorpusFundBasis('lumpsum')}
                        className={`px-3 py-2 ${corpusFundBasis === 'lumpsum' ? 'bg-blue-600 text-white font-semibold' : 'bg-white text-slate-600'}`}
                      >
                        Lumpsum
                      </button>
                      <button
                        type="button"
                        onClick={() => setCorpusFundBasis('persft')}
                        className={`px-3 py-2 ${corpusFundBasis === 'persft' ? 'bg-blue-600 text-white font-semibold' : 'bg-white text-slate-600'}`}
                      >
                        Per SFT
                      </button>
                    </div>
                    <input
                      type="text"
                      value={corpusFundAmount}
                      onChange={(e) => setCorpusFundAmount(e.target.value)}
                      placeholder="Amount"
                      className="flex-1 p-2.5 rounded-lg border border-[#ddd] text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* FSI & Maintenance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#333]">FSI Used</label>
                  <input
                    type="text"
                    value={fsiUsed}
                    onChange={(e) => setFsiUsed(e.target.value)}
                    placeholder="Ratio used + permissible maximum"
                    className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#333]">Maintenance Deposit</label>
                  <input
                    type="text"
                    value={maintenanceDeposit}
                    onChange={(e) => setMaintenanceDeposit(e.target.value)}
                    placeholder="Type e.g., ₹3.5 / sq ft"
                    className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save</span>
                </button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* 6. MEDIA & SPECIAL OFFER (Image 9)                       */}
          {/* -------------------------------------------------------- */}
          {activeSubItem === 'media' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-base font-bold font-heading text-[#111111]">Special Offer</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">Offer Text</label>
                    <input
                      type="text"
                      value={specialOfferText}
                      onChange={(e) => setSpecialOfferText(e.target.value)}
                      placeholder="e.g. Early bird offer"
                      className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">Offer End Date</label>
                    <input
                      type="date"
                      value={specialOfferEndDate}
                      onChange={(e) => setSpecialOfferEndDate(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">Image Description</label>
                    <input
                      type="text"
                      value={specialOfferDesc}
                      onChange={(e) => setSpecialOfferDesc(e.target.value)}
                      placeholder="e.g. Render image of project"
                      className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#333]">Special Offer Image</label>
                  <div className="border-2 border-dashed border-[#ddd] rounded-xl p-4 text-center space-y-2 bg-[#fcfcfc]">
                    <div className="relative inline-block">
                      <img
                        src="/design/master-plan.jpeg"
                        alt="Offer preview"
                        className="w-32 h-24 object-cover rounded-lg mx-auto border border-[#eee]"
                      />
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-[11px] text-blue-600 font-semibold cursor-pointer hover:underline">
                      Preview Image
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save</span>
                </button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* 7. NEIGHBORHOOD / WALKABILITY (Image 10)                 */}
          {/* -------------------------------------------------------- */}
          {activeSubItem === 'neighborhood' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-base font-bold font-heading text-[#111111]">Neighborhood / Walkability</h2>
              </div>

              {/* Accordion 1: Distance to Metro Station */}
              <div className="p-4 rounded-xl border border-[#dedede] bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[#111111]">Distance to Metro Station</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {metroStations.length} entries
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMetroStations([...metroStations, { name: 'Madhapur', distance: '3.9', coords: '17.4480, 78.3900', notes: 'Blue Line' }])}
                    className="px-3 py-1 rounded-md bg-[#10261a] text-white text-xs font-semibold hover:bg-[#1e6b3a] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>+ Add</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {metroStations.map((station, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-2.5 rounded-lg border border-[#eee] bg-[#fcfcfc] text-xs items-center">
                      <div className="md:col-span-2">
                        <label className="text-[10px] text-slate-400 block">Station Name</label>
                        <input
                          type="text"
                          defaultValue={station.name}
                          className="w-full p-1.5 rounded border border-[#ddd] text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block">Distance (km)</label>
                        <input
                          type="text"
                          defaultValue={station.distance}
                          className="w-full p-1.5 rounded border border-[#ddd] text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block">Map Coordinates</label>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            defaultValue={station.coords}
                            className="w-full p-1.5 rounded border border-[#ddd] text-xs"
                          />
                          <button type="button" className="p-1.5 rounded border border-[#ddd] text-xs bg-white">
                            📍
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <button type="button" className="text-slate-400 hover:text-slate-600"><Copy size={14} /></button>
                        <button type="button" onClick={() => setMetroStations(metroStations.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accordion 2: Nearest Bus Stop */}
              <div className="p-4 rounded-xl border border-[#dedede] bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[#111111]">Nearest Bus Stop</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {busStops.length} entries
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBusStops([...busStops, { name: 'DLF Gachibowli', distance: '4.2', notes: 'TSRTC Depot' }])}
                    className="px-3 py-1 rounded-md bg-[#10261a] text-white text-xs font-semibold hover:bg-[#1e6b3a] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>+ Add</span>
                  </button>
                </div>
              </div>

              {/* Accordion 3: Public Park Nearby */}
              <div className="p-4 rounded-xl border border-[#dedede] bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[#111111]">Public Park Nearby</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {parksNearby.length} entries
                    </span>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-md bg-[#10261a] text-white text-xs font-semibold hover:bg-[#1e6b3a] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>+ Add</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save</span>
                </button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* 8. OPEN SPACE & LANDSCAPING (Image 11)                   */}
          {/* -------------------------------------------------------- */}
          {activeSubItem === 'open_space' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-heading text-[#111111]">OPEN SPACE & LANDSCAPING</h2>
                  <p className="text-xs text-[#767676]">7 total landscaping features</p>
                </div>
              </div>

              {/* Landscaped Green Area Card matching Image 11 */}
              <div className="p-5 rounded-xl border-2 border-indigo-200 bg-white space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src="/design/garden.jpeg" alt="" className="w-10 h-10 rounded-lg object-cover" />
                    <strong className="text-sm text-[#111111]">Landscaped Green Area</strong>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                    ✓
                  </span>
                </div>

                {/* Tooltip & Info banners matching Image 11 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                    <span className="font-bold text-amber-600">?</span>
                    <span>Include tree groves, lawns, gardens</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                    <span className="font-bold text-blue-600">ℹ</span>
                    <span>For panoramic views and cross-ventilation corridor</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">Area in Square Meters</label>
                    <input
                      type="text"
                      value={landscapedGreenArea}
                      onChange={(e) => setLandscapedGreenArea(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">About Landscaped Green Area</label>
                    <input
                      type="text"
                      value={aboutGreenArea}
                      onChange={(e) => setAboutGreenArea(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">Image Description</label>
                    <input
                      type="text"
                      defaultValue="Central promenade with shade trees"
                      className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">Email Field</label>
                    <input
                      type="email"
                      defaultValue="builder@yopmail.com"
                      className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">Select Field</label>
                    <select className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs bg-white">
                      <option>Opt 3 (Premium Landscaping)</option>
                      <option>Opt 2 (Standard)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">Date Field</label>
                    <input
                      type="date"
                      defaultValue="2026-07-28"
                      className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">Stairs Access</label>
                    <div className="flex gap-4 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="stairs"
                          checked={greenAreaStairs === 'yes'}
                          onChange={() => setGreenAreaStairs('yes')}
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="stairs"
                          checked={greenAreaStairs === 'no'}
                          onChange={() => setGreenAreaStairs('no')}
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">Multi Select Options</label>
                    <div className="flex gap-4 text-xs">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" defaultChecked /> <span>Central Park</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" defaultChecked /> <span>Water Body</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save</span>
                </button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* 9. INDOOR AMENITIES (Image 12)                           */}
          {/* -------------------------------------------------------- */}
          {activeSubItem === 'indoor_amenities' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-base font-bold font-heading text-[#111111]">INDOOR AMENITIES</h2>
                <p className="text-xs text-[#767676]">12 total amenities</p>
              </div>

              {/* Multipurpose Hall Card matching Image 12 */}
              <div className="p-5 rounded-xl border border-[#dedede] bg-white space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm text-[#111111]">Multipurpose Hall</strong>
                  </div>
                  <input type="radio" checked readOnly className="w-4 h-4 text-indigo-600" />
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  ? For Parties, Events, etc.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">Is Multipurpose Hall Available?</label>
                    <div className="flex gap-4 text-xs mt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="mph_avail" defaultChecked /> <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="mph_avail" /> <span>No</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">About Multipurpose Hall</label>
                    <input
                      type="text"
                      defaultValue={indoorAmenities.multipurposeHall.desc}
                      className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">Image</label>
                    <button type="button" className="w-full p-3 border border-dashed border-[#ddd] rounded-lg text-xs text-blue-600 hover:bg-slate-50 flex items-center justify-center gap-1.5">
                      <Upload size={14} /> <span>Upload image</span>
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">Image Description</label>
                    <input
                      type="text"
                      defaultValue="Air-conditioned party hall with banquet seating"
                      className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Indoor Gym Card matching Image 12 */}
              <div className="p-5 rounded-xl border border-[#dedede] bg-white space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <strong className="text-sm text-[#111111]">Indoor Gym</strong>
                  <input type="radio" checked readOnly className="w-4 h-4 text-indigo-600" />
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  ? Dedicated space for cardio/weights, etc.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">About Indoor Gym</label>
                    <input
                      type="text"
                      defaultValue={indoorAmenities.indoorGym.desc}
                      className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">Image</label>
                    <button type="button" className="w-full p-3 border border-dashed border-[#ddd] rounded-lg text-xs text-blue-600 hover:bg-slate-50 flex items-center justify-center gap-1.5">
                      <Upload size={14} /> <span>Upload image</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save</span>
                </button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* 10. SUSTAINABILITY & SMART INFRASTRUCTURE (Image 13)     */}
          {/* -------------------------------------------------------- */}
          {activeSubItem === 'sustainability' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-base font-bold font-heading text-[#111111]">Sustainability & Smart Infrastructure</h2>
              </div>

              {/* Rainwater Harvesting */}
              <div className="p-4 rounded-xl border border-[#dedede] bg-white space-y-2">
                <strong className="text-xs text-[#111111] block">Rainwater Harvesting</strong>
                <input
                  type="text"
                  defaultValue={sustainability.rainwater}
                  className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                />
              </div>

              {/* Solar Power Generation matching Image 13 */}
              <div className="p-4 rounded-xl border border-[#dedede] bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-[#111111]">Solar Power Generation</strong>
                  <input type="radio" checked readOnly className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  ? Whether rooftop or solar panels are installed, KW, etc.
                </div>
                <input
                  type="text"
                  defaultValue={sustainability.solarPower}
                  className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                />
              </div>

              {/* STP (Sewage Treatment Plant) matching Image 13 */}
              <div className="p-4 rounded-xl border border-[#dedede] bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <strong className="text-xs text-[#111111]">STP (Sewage Treatment Plant)</strong>
                  <input type="radio" checked readOnly className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  ? Treated water reuse for landscaping, flushing. Capacity, etc.
                </div>
                <input
                  type="text"
                  defaultValue={sustainability.stp}
                  className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                />
              </div>

              {/* EV Charging */}
              <div className="p-4 rounded-xl border border-[#dedede] bg-white space-y-2">
                <strong className="text-xs text-[#111111] block">EV Charging Points</strong>
                <input
                  type="text"
                  defaultValue={sustainability.evCharging}
                  className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save</span>
                </button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* 11. AREAS FROM MASTER PLAN (Image 14)                    */}
          {/* -------------------------------------------------------- */}
          {activeSubItem === 'master_plan_areas' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-base font-bold font-heading text-[#111111]">Areas from Master Plan</h2>
              </div>

              {/* Total Project Built-Up Area Card matching Image 14 */}
              <div className="p-5 rounded-xl border border-[#dedede] bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src="/design/master-plan.jpeg" alt="" className="w-8 h-8 rounded object-cover" />
                    <strong className="text-sm text-[#111111]">Total Project Built-Up Area</strong>
                  </div>
                  <input type="radio" checked readOnly className="w-4 h-4 text-indigo-600" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    ? Actual building coverage area only
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                    ℹ Verified with GHMC master plan submission
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">In Square Meters</label>
                    <input
                      type="text"
                      value={totalBuiltUpArea}
                      onChange={(e) => setTotalBuiltUpArea(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">Select floating</label>
                    <select className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs bg-white">
                      <option>test22</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#333]">Area Field</label>
                    <input
                      type="text"
                      defaultValue="balcony"
                      className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Total Setback Area */}
              <div className="p-5 rounded-xl border border-[#dedede] bg-white space-y-2">
                <strong className="text-sm text-[#111111] block">Total Setback Area (all sides)</strong>
                <input
                  type="text"
                  value={totalSetbackArea}
                  onChange={(e) => setTotalSetbackArea(e.target.value)}
                  placeholder="Enter number..."
                  className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                />
              </div>

              {/* Driveways & Roads */}
              <div className="p-5 rounded-xl border border-[#dedede] bg-white space-y-2">
                <strong className="text-sm text-[#111111] block">Driveways & Roads Area</strong>
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded">
                  ? Total paved vehicular surface
                </p>
                <input
                  type="text"
                  value={drivewaysArea}
                  onChange={(e) => setDrivewaysArea(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[#ddd] text-xs"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save</span>
                </button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* 12. UNIT CONFIGURATION (Image 15)                        */}
          {/* -------------------------------------------------------- */}
          {activeSubItem === 'unit_configuration' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-base font-bold font-heading text-[#111111]">Unit Configuration</h2>
              </div>

              {/* Header Selector Pills matching Image 15 */}
              <div className="space-y-3 pb-4 border-b border-[#eee]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#5c5c5c]">Phase:</span>
                  <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold">
                    Phase 1
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#5c5c5c]">Blocks:</span>
                  <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold">
                    Tower A
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-[#5c5c5c] block mb-2">Floors:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setSelectedFloor(f)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                          selectedFloor === f
                            ? 'bg-[#10261a] text-white'
                            : 'bg-[#f7f7f7] text-[#5c5c5c] border border-[#ddd] hover:bg-[#eee]'
                        }`}
                      >
                        Floor {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upload Boxes matching Image 15 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-[#dedede] bg-white text-center space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#333]">Images (0/5)</span>
                    <button type="button" className="px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold flex items-center gap-1">
                      <Upload size={12} /> <span>Upload</span>
                    </button>
                  </div>
                  <div className="py-6 border-2 border-dashed border-[#eee] rounded-lg">
                    <Upload size={24} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs text-slate-500">Upload phase images (up to 5)</p>
                    <small className="text-[10px] text-slate-400">Max 5 images · JPG, PNG, WEBP</small>
                  </div>
                </div>

                <div className="p-5 rounded-xl border border-[#dedede] bg-white text-center space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#333]">Plan Images (0/5)</span>
                    <button type="button" className="px-3 py-1 rounded bg-blue-600 text-white text-xs font-semibold flex items-center gap-1">
                      <Upload size={12} /> <span>Upload</span>
                    </button>
                  </div>
                  <div className="py-6 border-2 border-dashed border-[#eee] rounded-lg">
                    <Upload size={24} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs text-slate-500">Upload blueprint images (up to 5)</p>
                    <small className="text-[10px] text-slate-400">Max 5 blueprint files</small>
                  </div>
                </div>
              </div>

              {/* Archetypes Chips matching Image 15 */}
              <div className="space-y-3 pt-4 border-t border-[#eee]">
                <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider font-mono">
                  Archetypes
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {allArchetypes.map((arch) => {
                    const isSelected = selectedArchetypes.includes(arch);
                    return (
                      <button
                        key={arch}
                        type="button"
                        onClick={() => toggleArchetype(arch)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-[#10261a] text-white border-[#10261a]'
                            : 'bg-white text-slate-700 border-[#ddd] hover:border-slate-400'
                        }`}
                      >
                        <span>{arch}</span>
                        <span>{isSelected ? '✓' : '+'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Rooms Matrix */}
              <div className="bg-[#fcfcfc] rounded-xl border border-[#dedede] p-4 text-xs space-y-2">
                <span className="font-bold text-[#111] block">Configured Spaces for Floor {selectedFloor}:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  {selectedArchetypes.map(a => (
                    <div key={a} className="p-2 bg-white rounded border border-[#eee]">
                      <strong className="block text-[#10261a]">{a}</strong>
                      <span className="text-slate-400">Standard Schedule</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save Unit Configuration</span>
                </button>
              </div>
            </div>
          )}

          {/* -------------------------------------------------------- */}
          {/* 13. VIEW SUMMARY TAB                                     */}
          {/* -------------------------------------------------------- */}
          {activeSubItem === 'summary' && (
            <div className="space-y-6 max-w-4xl text-xs">
              <div>
                <h2 className="text-base font-bold font-heading text-[#111111]">Property Specification Summary</h2>
                <p className="text-[#767676]">Complete consolidated dossier submitted by developer</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[#dedede] bg-[#fcfcfc] space-y-2">
                  <h3 className="font-bold text-sm text-[#10261a]">Project Identity</h3>
                  <p><strong>Name:</strong> {projectName}</p>
                  <p><strong>RERA No:</strong> {reraNo}</p>
                  <p><strong>Type:</strong> {projectType}</p>
                  <p><strong>Location:</strong> {area}, {city}</p>
                  <p><strong>Site Area:</strong> {projectSizeAcres} Acres ({noOfUnits} units)</p>
                </div>

                <div className="p-4 rounded-xl border border-[#dedede] bg-[#fcfcfc] space-y-2">
                  <h3 className="font-bold text-sm text-[#10261a]">Towers & Infrastructure</h3>
                  <p><strong>Phases:</strong> {phases.length} ({phases.map(p => p.name).join(', ')})</p>
                  <p><strong>Blocks:</strong> {blocks.length} ({blocks.map(b => `${b.name} (${b.floors} floors)`).join(', ')})</p>
                  <p><strong>Total Computed Units:</strong> {blocks.reduce((acc, b) => acc + (b.floors * b.unitsPerFloor), 0)}</p>
                  <p><strong>Base Rate:</strong> ₹8,600 / sq ft</p>
                </div>
              </div>

              <div className="p-4 bg-[#eef7f1] rounded-xl border border-[#bfddc9] flex items-center justify-between">
                <div>
                  <strong className="text-sm text-[#1e6b3a] block">Ready to Publish to Live Directory</strong>
                  <span className="text-[11px] text-slate-600">All required fields validated with 0 errors.</span>
                </div>
                <Link
                  to="/properties/1"
                  className="px-4 py-2 bg-[#10261a] hover:bg-[#1e6b3a] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>View Published Listing</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
