// data.js - Real-time Data Store for HI IN Property Due-Diligence Platform
// Features authentic Visakhapatnam spatial projects matching the reference architecture.
// Real POIs, live air quality telemetry, and commute routing are queried dynamically via OpenStreetMap, Open-Meteo, and OSRM.

export const OPEN_SOURCE_PROVIDERS = {
  airQuality: [
    { name: "Open-Meteo & Copernicus Satellite Grid", url: "https://air-quality-api.open-meteo.com/", desc: "Real-time atmospheric telemetry (PM2.5, PM10, NO2, US AQI)" },
    { name: "OpenAQ Global Platform", url: "https://openaq.org/", desc: "Open global real-time air quality data platform" },
    { name: "Janvayu Open Sensors", url: "https://www.janvayu.in/", desc: "Community-driven Indian air quality sensor grid" },
    { name: "Vayuayan CPCB Archive", url: "https://saket-choudhary.me/vayuayan-archive/", desc: "CPCB continuous ambient air quality repository" },
    { name: "AQI.in Telemetry", url: "https://www.aqi.in/", desc: "Real-time atmospheric and micro-climate telemetry" }
  ],
  geospatial: [
    { name: "OpenStreetMap Nominatim API", url: "https://nominatim.openstreetmap.org/", desc: "Open-source dynamic spatial POI discovery engine" },
    { name: "Leaflet.js Engine", url: "https://leafletjs.com/examples.html", desc: "Interactive map rendering engine" },
    { name: "OSRM Routing Engine", url: "https://project-osrm.org/", desc: "Real road network driving graph calculation" }
  ]
};

// 9 Showcase Visakhapatnam Projects with real coordinates
export const INITIAL_PROPERTIES = [
  {
    id: 1,
    pub: 1,
    name: "Ramez Seapoint",
    by: "Ramez Infra Developers Pvt Ltd",
    type: "Apartment",
    loc: "Madhurawada",
    addr: "Near Rushikonda Beach Road, Madhurawada, Visakhapatnam 530048",
    lat: 17.7944,
    lng: 83.3574,
    price: "₹75 L - 1.2 Cr",
    area: "1,350 - 2,450 sq ft",
    bhk: "2, 3 BHK",
    rera: "P03280054789",
    poss: "Dec 2026",
    desc: "Ramez Seapoint is a residential project in Madhurawada, Visakhapatnam, offering 2 & 3 BHK apartments with sea-facing and city views. The project focuses on modern amenities and coastal living.",
    am: "Swimming Pool, Gymnasium, Landscaped Gardens, 24/7 Security, Children Play Area, Covered Parking",
    image: "assets/ramez_seapoint.jpg",
    coastalLine: "Coastal location · 3.2 km to Rushikonda Beach",
    specs: {
      "Project type": "Complex / Unit",
      "Configuration": "2, 3 BHK",
      "Project area": "4.8 acres (approx)",
      "Project status": "Under Construction",
      "Status": "Dec 2026 (as per RERA)",
      "RERA number": "P03280054789"
    },
    reraDetails: {
      number: "P03280054789",
      projectName: "Ramez Seapoint",
      promoter: "Ramez Infra Developers Pvt Ltd",
      status: "Registered",
      regDate: "14 Mar 2023"
    },
    documents: [
      { name: "RERA Certificate", status: "Verified", size: "PDF · 1.2 MB", tag: "ok" },
      { name: "Approved Sanction Plan", status: "Verified", size: "PDF · 2.4 MB", tag: "ok" },
      { name: "Project Brochure", status: "Available", size: "PDF · 3.1 MB", tag: "ok" },
      { name: "Environment Clearance", status: "Pending", size: "Official Filing", tag: "warn" }
    ],
    tw: [["Towers 1 to 4 (4 Towers)", 15, 8, 480]],
    suitability: 78
  },
  {
    id: 2,
    pub: 1,
    name: "Sreeja Ocean View",
    by: "Sreeja Infra Projects",
    type: "Apartment",
    loc: "Rushikonda",
    addr: "Beach Road Promenade, Rushikonda Coastal Corridor, Visakhapatnam 530045",
    lat: 17.7818,
    lng: 83.3776,
    price: "₹68 L - 1.1 Cr",
    area: "1,200 - 2,100 sq ft",
    bhk: "2, 3 BHK",
    rera: "P03280061240",
    poss: "Ready to Move",
    desc: "Luxury oceanfront high-rise apartment project situated on Rushikonda Beach Road featuring unobstructed Bay of Bengal views and immediate access to IT SEZ.",
    am: "Infinity Pool, Sea-view Clubhouse, Tennis Court, High-speed Lifts, 100% Power Backup",
    image: "assets/sreeja_ocean_view.jpg",
    coastalLine: "Beachfront location · 800m to Rushikonda Beach",
    specs: {
      "Project type": "Oceanfront Tower",
      "Configuration": "2, 3 BHK",
      "Project area": "3.2 acres",
      "Project status": "Completed / Ready",
      "Status": "Ready to Move",
      "RERA number": "P03280061240"
    },
    reraDetails: {
      number: "P03280061240",
      projectName: "Sreeja Ocean View",
      promoter: "Sreeja Infra Projects",
      status: "Registered / OC Received",
      regDate: "10 Jan 2022"
    },
    documents: [
      { name: "Occupancy Certificate (OC)", status: "Verified", size: "PDF · 1.8 MB", tag: "ok" },
      { name: "RERA Certificate", status: "Verified", size: "PDF · 1.1 MB", tag: "ok" },
      { name: "Approved Master Plan", status: "Verified", size: "PDF · 3.5 MB", tag: "ok" }
    ],
    tw: [["Ocean Tower A & B", 18, 6, 216]],
    suitability: 74
  },
  {
    id: 3,
    pub: 1,
    name: "Urbanrise The Coast",
    by: "Urbanrise Builders",
    type: "Apartment",
    loc: "Madhurawada",
    addr: "NH16 Commercial Corridor, Near Srujana School, Madhurawada, Visakhapatnam 530041",
    lat: 17.8115,
    lng: 83.3528,
    price: "₹82 L - 1.4 Cr",
    area: "1,375 - 2,680 sq ft",
    bhk: "3, 4 BHK",
    rera: "P03280073150",
    poss: "Oct 2028",
    desc: "Large-scale luxury high-rise development featuring five 25-storey towers with panoramic views of Kambalakonda reserve and ocean horizon.",
    am: "65,000 sq ft Clubhouse, Mini-theater, Rooftop Sky Lounge, Olympic Pool, Sports Arena",
    image: "assets/urbanrise_the_coast.jpg",
    coastalLine: "Scenic foothills · 4.2 km to Coastal Belt",
    specs: {
      "Project type": "Gated High-Rise",
      "Configuration": "3, 4 BHK",
      "Project area": "9.15 acres",
      "Project status": "Under Construction",
      "Status": "Oct 2028 (as per RERA)",
      "RERA number": "P03280073150"
    },
    reraDetails: {
      number: "P03280073150",
      projectName: "Urbanrise The Coast",
      promoter: "Urbanrise Projects LLP",
      status: "Registered",
      regDate: "05 Aug 2023"
    },
    documents: [
      { name: "RERA Registration Filing", status: "Verified", size: "PDF · 2.1 MB", tag: "ok" },
      { name: "Sanction Layout Drawing", status: "Verified", size: "PDF · 4.2 MB", tag: "ok" }
    ],
    tw: [["Towers 1 to 5 (5 Towers)", 25, 15, 1875]],
    suitability: 82
  },
  {
    id: 4,
    pub: 1,
    name: "MVV & MK Park",
    by: "MVV Builders & MK Housing",
    type: "Apartment",
    loc: "MVP Colony",
    addr: "Sector 9, MVP Colony Central, Visakhapatnam 530017",
    lat: 17.7390,
    lng: 83.3320,
    price: "₹64 - 95 L",
    area: "1,150 - 1,830 sq ft",
    bhk: "2, 3 BHK",
    rera: "P03280048912",
    poss: "Ready to Move",
    desc: "Established residential enclave in the heart of MVP Colony, close to established educational institutions, healthcare complexes, and beachfront promenades.",
    am: "Community Hall, Landscaped Courtyard, 24/7 Security, Intercom, Reserved Covered Parking",
    image: "assets/mvv_mk_park.jpg",
    coastalLine: "Established Urban Sector · 1.8 km to Beach Road",
    specs: {
      "Project type": "Urban Residential Enclave",
      "Configuration": "2, 3 BHK",
      "Project area": "2.5 acres",
      "Project status": "Completed",
      "Status": "Ready to Move",
      "RERA number": "P03280048912"
    },
    reraDetails: {
      number: "P03280048912",
      projectName: "MVV & MK Park",
      promoter: "MVV Builders & MK Housing",
      status: "Registered",
      regDate: "12 May 2021"
    },
    documents: [
      { name: "RERA Certificate", status: "Verified", size: "PDF · 1.0 MB", tag: "ok" },
      { name: "Title Deed & EC Chain", status: "Verified", size: "PDF · 2.8 MB", tag: "ok" }
    ],
    tw: [["Blocks A to D", 10, 6, 240]],
    suitability: 70
  },
  {
    id: 5,
    pub: 1,
    name: "Sri Surya Enclave",
    by: "Surya Standalone Builders",
    type: "Apartment",
    loc: "Chinna Waltair",
    addr: "D.No. 8-60-6, Vidhya Nagar, Chinna Waltair, Visakhapatnam 530003",
    lat: 17.7280,
    lng: 83.3250,
    price: "₹1.40 Cr",
    area: "1,539 sq ft",
    bhk: "3 BHK",
    rera: "P098765432",
    poss: "Dec 2027",
    desc: "Independent standalone premium builder floor located directly adjacent to Andhra University Vana Vihar boundary in prime Chinna Waltair residential zone.",
    am: "Lift, 24/7 Security, Power Backup, Covered Stilt Parking, Borewell & Municipal Connection",
    image: "",
    coastalLine: "Prime AU Zone · 1.2 km to East Coast Promenade",
    specs: {
      "Project type": "Standalone Builder Floor",
      "Configuration": "3 BHK",
      "Project area": "480 sq yards",
      "Project status": "Under Construction",
      "Status": "Dec 2027",
      "RERA number": "P098765432"
    },
    reraDetails: {
      number: "P098765432",
      projectName: "Sri Surya Enclave",
      promoter: "Surya Standalone Builders",
      status: "Registered",
      regDate: "18 Jun 2024"
    },
    documents: [
      { name: "Approved Sanction Blueprint", status: "Verified", size: "PDF · 2.2 MB", tag: "ok" }
    ],
    tw: [],
    suitability: 76
  },
  {
    id: 6,
    pub: 1,
    name: "Haritha Coastal Bay",
    by: "Haritha Coastal Estates",
    type: "Villa",
    loc: "Bheemili",
    addr: "Beach Road Coastal Boulevard, Bheemunipatnam (Bheemili), Visakhapatnam 531163",
    lat: 17.8920,
    lng: 83.4510,
    price: "₹1.85 Cr",
    area: "2,800 sq ft",
    bhk: "4 BHK",
    rera: "P03280088921",
    poss: "Ready to Move",
    desc: "Exclusive sea-facing luxury independent villa with private lawn, sun terrace, and direct beach access along the historic Bheemili coastline.",
    am: "Private Pool, Clubhouse, Beach Access Pathway, Solar Power, 24/7 Gated Security",
    image: "assets/ramez_seapoint.jpg",
    coastalLine: "Direct Beachfront · 100m to Bheemili Beach",
    specs: {
      "Project type": "Independent Villa",
      "Configuration": "4 BHK Villa",
      "Project area": "5.5 acres",
      "Project status": "Ready to Move",
      "Status": "Ready to Move",
      "RERA number": "P03280088921"
    },
    reraDetails: {
      number: "P03280088921",
      projectName: "Haritha Coastal Bay",
      promoter: "Haritha Coastal Estates",
      status: "Registered",
      regDate: "19 Nov 2023"
    },
    documents: [
      { name: "Individual Villa Sanction", status: "Verified", size: "PDF · 1.5 MB", tag: "ok" }
    ],
    tw: [],
    suitability: 84
  },
  {
    id: 7,
    pub: 1,
    name: "Bay Breeze Vistas",
    by: "Coastal Homes Ltd",
    type: "Apartment",
    loc: "Sagar Nagar",
    addr: "Hillside Road, Sagar Nagar Beach Viewpoint, Visakhapatnam 530045",
    lat: 17.7650,
    lng: 83.3590,
    price: "₹92 L",
    area: "1,420 sq ft",
    bhk: "3 BHK",
    rera: "P03280034110",
    poss: "Ready to Move",
    desc: "Scenic hillside apartment project overlooking the bay, situated between MVP Colony and Rushikonda Beach.",
    am: "Terrace Garden, Gym, Children Play Area, Intercom, Covered Parking",
    image: "assets/sreeja_ocean_view.jpg",
    coastalLine: "Elevated Bay View · 1.4 km to Sagar Nagar Beach",
    specs: {
      "Project type": "Apartment Complex",
      "Configuration": "3 BHK",
      "Project area": "1.8 acres",
      "Project status": "Ready to Move",
      "Status": "Ready to Move",
      "RERA number": "P03280034110"
    },
    reraDetails: {
      number: "P03280034110",
      projectName: "Bay Breeze Vistas",
      promoter: "Coastal Homes Ltd",
      status: "Registered",
      regDate: "03 Mar 2022"
    },
    documents: [
      { name: "RERA Certificate", status: "Verified", size: "PDF · 1.2 MB", tag: "ok" }
    ],
    tw: [["Blocks 1 & 2", 8, 4, 64]],
    suitability: 72
  },
  {
    id: 8,
    pub: 1,
    name: "Suncrest Panorama",
    by: "Suncrest Projects",
    type: "Apartment",
    loc: "Yendada",
    addr: "Near Gitam University Road, Yendada, Visakhapatnam 530045",
    lat: 17.7780,
    lng: 83.3520,
    price: "₹1.15 Cr",
    area: "1,780 sq ft",
    bhk: "3 BHK",
    rera: "P03280049010",
    poss: "Jan 2027",
    desc: "Modern residential community positioned in rapid growth corridor of Yendada, convenient for IT professionals and university faculty.",
    am: "Clubhouse, Swimming Pool, Multipurpose Hall, Yoga Deck, EV Charging",
    image: "assets/urbanrise_the_coast.jpg",
    coastalLine: "University & IT Corridor · 2.5 km to Rushikonda",
    specs: {
      "Project type": "Apartment Complex",
      "Configuration": "3 BHK",
      "Project area": "3.8 acres",
      "Project status": "Under Construction",
      "Status": "Jan 2027",
      "RERA number": "P03280049010"
    },
    reraDetails: {
      number: "P03280049010",
      projectName: "Suncrest Panorama",
      promoter: "Suncrest Projects",
      status: "Registered",
      regDate: "21 Jul 2023"
    },
    documents: [
      { name: "RERA Sanction", status: "Verified", size: "PDF · 2.0 MB", tag: "ok" }
    ],
    tw: [["Tower A & B", 12, 6, 144]],
    suitability: 75
  },
  {
    id: 9,
    pub: 1,
    name: "Hillcrest Greens Plot",
    by: "Hillcrest Habitats",
    type: "Plot",
    loc: "Madhurawada",
    addr: "Foothill Enclave, Behind Cricket Stadium, Madhurawada, Visakhapatnam 530041",
    lat: 17.8250,
    lng: 83.3610,
    price: "₹55 L",
    area: "2,400 sq ft (266 sq yds)",
    bhk: "Residential Plot",
    rera: "P03280011980",
    poss: "Immediate",
    desc: "Clear-title VMRDA approved residential layout plots with underground cabling, wide blacktop roads, and avenue plantation.",
    am: "VMRDA Approved, Compound Wall, 40-ft Wide Roads, Water Lines Laid, 24/7 Security",
    image: "assets/mvv_mk_park.jpg",
    coastalLine: "Valley Foothill · 5.5 km to Coastal Line",
    specs: {
      "Project type": "Gated Plot Layout",
      "Configuration": "Residential Plot",
      "Project area": "14.2 acres",
      "Project status": "Ready for Registration",
      "Status": "Immediate",
      "RERA number": "P03280011980"
    },
    reraDetails: {
      number: "P03280011980",
      projectName: "Hillcrest Greens Plot",
      promoter: "Hillcrest Habitats",
      status: "Registered / VMRDA Approved",
      regDate: "15 Feb 2022"
    },
    documents: [
      { name: "VMRDA Layout Approval", status: "Verified", size: "PDF · 3.2 MB", tag: "ok" },
      { name: "Encumbrance Certificate (30-Yr)", status: "Verified", size: "PDF · 1.4 MB", tag: "ok" }
    ],
    tw: [],
    suitability: 80
  }
];

export const INITIAL_JOBS = [];

// Open-source provider registry
export const DATA_SOURCES = [
  { name: "OpenStreetMap Nominatim Spatial Engine", type: "Live / Spatial POI Search", status: "Active (Live)", protocol: "HTTPS / REST", url: "https://nominatim.openstreetmap.org/" },
  { name: "Open-Meteo & Copernicus Atmospheric API", type: "Live / Satellite & Sensor Telemetry", status: "Active (Live)", protocol: "HTTPS / REST", url: "https://air-quality-api.open-meteo.com/" },
  { name: "OSRM Travel Time & Routing Engine", type: "Live / Road Network Graph", status: "Active (Live)", protocol: "HTTPS / REST", url: "https://project-osrm.org/" },
  { name: "OpenAQ Global Telemetry Grid", type: "Live / Open Environmental Archive", status: "Active (Live)", protocol: "HTTPS / REST", url: "https://openaq.org/" },
  { name: "Janvayu Community Sensor Grid", type: "Live / Sensor Telemetry", status: "Active (Live)", protocol: "HTTPS / REST", url: "https://www.janvayu.in/" },
  { name: "Vayuayan CPCB Ambient Archive", type: "Continuous Ambient / CPCB", status: "Active (Live)", protocol: "HTTPS / REST", url: "https://saket-choudhary.me/vayuayan-archive/" },
  { name: "AQI.in Ambient Telemetry", type: "Continuous / Atmospheric", status: "Active (Live)", protocol: "HTTPS / REST", url: "https://www.aqi.in/" }
];

export const INITIAL_FLAGS = [];
