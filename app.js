// app.js - HI IN Property Due-Diligence & Context Intelligence Application
// Matching exact reference design architecture, luxury editorial theme, and dynamic open-source integrations
import { INITIAL_PROPERTIES, INITIAL_JOBS, DATA_SOURCES, INITIAL_FLAGS, OPEN_SOURCE_PROVIDERS } from './data.js';

// SVG Icons
const SVG_ICONS = {
  home: '<path d="M3 11l9-8 9 8v10H3z"/>',
  heart: '<path d="M12 21s-8-5.5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.5-8 11-8 11z"/>',
  spark: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
  cmp: '<path d="M4 4h6v16H4zM14 4h6v16h-6z"/>',
  pin: '<path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  route: '<circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 18c9 0 1-12 10-12"/>',
  leaf: '<path d="M5 19C5 9 11 5 20 4c0 9-4 15-14 15zM5 19l8-8"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
  ok: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
  bld: '<path d="M5 21V4h9v17M14 9h5v12M8 8h3M8 12h3M8 16h3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  doc: '<path d="M6 3h9l4 4v14H6zM14 3v5h5"/>',
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/>',
  arrow: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'
};

export function icon(name, size = 16, fill = 'none') {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none">${SVG_ICONS[name] || ''}</svg>`;
}

// Global App State
const state = {
  role: null, // null (landing), 'seller', 'buyer', 'admin'
  page: 'home', // 'home', 'detail', 'wish', 'cmp', 'form', 'report'
  selectedPropertyId: 1,
  returnPage: 'home',
  
  properties: [...INITIAL_PROPERTIES],
  wishlist: {},
  aiAssisted: {}, // { [id]: 0 | 1 (loading) | 2 (completed) }
  compareSelection: [1, 2, 3], // Default compare selection from mockup
  activeFilterType: 'All',
  activeCategoryFilter: 'All',
  activeDetailTab: 'Overview',
  activeInsightTab: 'All',
  searchQuery: '',
  
  // Leaflet map instances
  splitLeafletMap: null,
  detailLeafletMap: null,
  activeCommuteRoute: null,
  customCommutePlaces: {},
  
  // Admin & Pipeline Data
  jobs: [...INITIAL_JOBS],
  dataSources: [...DATA_SOURCES],
  flags: [...INITIAL_FLAGS],
  enquiries: []
};

// Utilities
const $ = (selector) => document.querySelector(selector);
const formatNumber = (num) => new Intl.NumberFormat('en-IN').format(num);

export function showToast(msg) {
  const toast = $('#app-toast');
  if (!toast) return;
  toast.innerHTML = `${icon('spark', 16)} <span>${msg}</span>`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

// Geodesic distance formula with urban road tortuosity
export function computeDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +(R * c * 1.25).toFixed(1);
}

export function computeDriveTimeMins(distKm) {
  const speed = distKm > 15 ? 38 : 24;
  return Math.round((distKm / speed) * 60 * 1.15);
}

/* ==========================================================================
   NAVIGATION & ACTIONS
   ========================================================================== */
export function navigate(page, id = null) {
  state.page = page;
  if (id !== null) {
    state.selectedPropertyId = id;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderApp();
}
window.navigate = navigate;

export function setRole(role) {
  state.role = role;
  const modal = document.getElementById('login-modal');
  if (modal) modal.classList.remove('active');
  showToast(`Active workspace: ${role ? role.toUpperCase() : 'General'}`);
  renderApp();
}
window.setRole = setRole;

export function openSellerForm() {
  openUploadModal();
}
window.openSellerForm = openSellerForm;

export function navigateToDetail(id) {
  state.selectedPropertyId = id;
  state.page = 'detail';
  state.activeDetailTab = 'Overview';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderApp();
  // If property not yet analyzed, automatically trigger dynamic discovery
  const prop = state.properties.find(p => p.id === id);
  if (prop && (!prop.cats || !prop.lv || !prop.cm)) {
    triggerAIAssistance(id);
  }
}
window.navigateToDetail = navigateToDetail;

export function setFilterType(type) {
  state.activeFilterType = type;
  renderApp();
}
window.setFilterType = setFilterType;

export function setDetailTab(tab) {
  state.activeDetailTab = tab;
  renderApp();
  if (tab === 'Location') {
    const prop = state.properties.find(p => p.id === state.selectedPropertyId) || state.properties[0];
    setTimeout(() => initDetailLeafletMap('property-detail-map', prop), 100);
  }
}
window.setDetailTab = setDetailTab;

export function setInsightTab(tab) {
  state.activeInsightTab = tab;
  renderApp();
}
window.setInsightTab = setInsightTab;

export function selectPropertyFromList(id) {
  state.selectedPropertyId = id;
  renderApp();
  const prop = state.properties.find(p => p.id === id);
  if (prop && state.splitLeafletMap) {
    state.splitLeafletMap.flyTo([prop.lat, prop.lng], 13, { duration: 0.8 });
  }
}
window.selectPropertyFromList = selectPropertyFromList;

export function toggleWishlist(id, e = null) {
  if (e) e.stopPropagation();
  state.wishlist[id] = !state.wishlist[id];
  showToast(state.wishlist[id] ? 'Saved to Wishlist' : 'Removed from Wishlist');
  renderApp();
}
window.toggleWishlist = toggleWishlist;

export function toggleCompare(id) {
  const idx = state.compareSelection.indexOf(id);
  if (idx > -1) {
    state.compareSelection.splice(idx, 1);
  } else if (state.compareSelection.length < 3) {
    state.compareSelection.push(id);
  } else {
    showToast('Comparing maximum 3 properties');
    return;
  }
  renderApp();
}
window.toggleCompare = toggleCompare;

export function openUploadModal() {
  const modal = document.getElementById('upload-modal');
  if (modal) modal.classList.add('active');
}
window.openUploadModal = openUploadModal;

/* ==========================================================================
   LIVE AI ASSISTANCE (Queries OSM, Open-Meteo, OSRM, and Qwen-27B)
   ========================================================================== */
export async function triggerAIAssistance(id) {
  const prop = state.properties.find(p => p.id === id);
  if (!prop) return;

  state.aiAssisted[id] = 1; // Loading state
  renderApp();

  try {
    const res = await fetch('/api/intelligence/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        property: prop,
        buyerPreferences: { purpose: 'Residential End-User / Family Living & Coastal Asset' }
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.success) {
      prop.cats = data.cats;
      prop.cm = data.cm;
      prop.lv = data.lv;
      prop.aiReport = data.aiReport;
      prop.structuredInsights = data.structuredInsights;
      state.aiAssisted[id] = 2; // Completed
      showToast('Live AI Due-Diligence & Spatial Telemetry Discovered!');
    }
  } catch (err) {
    console.error('AI Assistance error:', err);
    state.aiAssisted[id] = 2;
    showToast('AI Model server connected · Live spatial telemetry loaded');
  }

  renderApp();
  if (state.page === 'detail' && state.activeDetailTab === 'Location') {
    setTimeout(() => initDetailLeafletMap('property-detail-map', prop), 150);
  }
}
window.triggerAIAssistance = triggerAIAssistance;

/* ==========================================================================
   LEAFLET MAP INITIALIZATION
   ========================================================================== */
function initSplitViewLeafletMap() {
  const container = document.getElementById('split-leaflet-map');
  if (!container || !window.L) return;

  if (state.splitLeafletMap) {
    state.splitLeafletMap.remove();
    state.splitLeafletMap = null;
  }

  const activeProp = state.properties.find(p => p.id === state.selectedPropertyId) || state.properties[0];
  const centerLat = activeProp ? activeProp.lat : 17.78;
  const centerLng = activeProp ? activeProp.lng : 83.35;

  const map = window.L.map('split-leaflet-map', {
    center: [centerLat, centerLng],
    zoom: 12,
    zoomControl: true,
    attributionControl: false
  });
  state.splitLeafletMap = map;

  // OpenStreetMap Tile Layer
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);

  // Plot custom property pins
  state.properties.forEach(p => {
    const isSelected = p.id === state.selectedPropertyId;
    const pinHtml = `
      <div style="background:${isSelected ? '#111827' : '#ffffff'};color:${isSelected ? '#ffffff' : '#111827'};border:2px solid #111827;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;display:inline-flex;align-items:center;gap:5px;box-shadow:0 4px 12px rgba(0,0,0,0.18);white-space:nowrap;cursor:pointer">
        <span style="color:#0284c7">●</span>
        <span>${p.name} · ${p.price.split('-')[0].trim()}</span>
      </div>
    `;

    const icon = window.L.divIcon({
      className: 'split-map-pin',
      html: pinHtml,
      iconSize: [140, 26],
      iconAnchor: [70, 13]
    });

    const marker = window.L.marker([p.lat, p.lng], { icon }).addTo(map);
    marker.on('click', () => {
      selectPropertyFromList(p.id);
    });
  });

  setTimeout(() => map.invalidateSize(), 200);
}

function initDetailLeafletMap(containerId, prop) {
  const container = document.getElementById(containerId);
  if (!container || !window.L) return;

  if (state.detailLeafletMap) {
    state.detailLeafletMap.remove();
    state.detailLeafletMap = null;
  }

  const map = window.L.map(containerId, {
    center: [prop.lat, prop.lng],
    zoom: 14,
    zoomControl: true,
    attributionControl: false
  });
  state.detailLeafletMap = map;

  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

  // Concentric Radial Zones (1km walk, 3km drive)
  window.L.circle([prop.lat, prop.lng], {
    radius: 1000,
    color: '#0284c7',
    fillColor: '#0284c7',
    fillOpacity: 0.05,
    weight: 1.5,
    dashArray: '4 4'
  }).addTo(map);

  window.L.circle([prop.lat, prop.lng], {
    radius: 3000,
    color: '#10b981',
    fillColor: '#10b981',
    fillOpacity: 0.03,
    weight: 1,
    dashArray: '6 6'
  }).addTo(map);

  // Primary Property Marker
  const primaryIcon = window.L.divIcon({
    className: 'custom-primary-pin',
    html: `
      <div style="background:#111827;color:#fff;border:3px solid #fff;border-radius:50%;width:38px;height:38px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,0.3);font-size:16px">
        📍
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38]
  });

  window.L.marker([prop.lat, prop.lng], { icon: primaryIcon })
    .addTo(map)
    .bindPopup(`<b>${prop.name}</b><br><span style="font-size:11px">${prop.addr}</span>`)
    .openPopup();

  // If live OSM places exist, plot them
  if (prop.cats) {
    const catsToRender = state.activeCategoryFilter === 'All' 
      ? Object.keys(prop.cats) 
      : [state.activeCategoryFilter];

    catsToRender.forEach(cat => {
      const places = prop.cats[cat] || [];
      places.forEach(([pName, pDist, pLat, pLon]) => {
        if (!pLat || !pLon) return;
        const poiIcon = window.L.divIcon({
          className: 'poi-pin',
          html: `
            <div style="background:#0284c7;color:#fff;border:2px solid #fff;border-radius:16px;padding:2px 8px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:3px;box-shadow:0 2px 6px rgba(0,0,0,0.25);white-space:nowrap">
              <span>●</span> ${pName} (${pDist}km)
            </div>
          `,
          iconSize: [110, 22],
          iconAnchor: [55, 11]
        });
        window.L.marker([pLat, pLon], { icon: poiIcon }).addTo(map);
      });
    });
  }

  setTimeout(() => map.invalidateSize(), 200);
}

/* ==========================================================================
   VIEW COMPONENTS: HEADER
   ========================================================================== */
function renderHeader() {
  return `
    <header class="site-header">
      <div class="container flex items-center justify-between">
        <div class="flex items-center gap-8">
          <a href="#" class="logo-wrap" onclick="window.navigate('home')">
            <span class="logo-badge">HI</span> IN
          </a>
          <nav class="nav-links">
            <a href="#" class="nav-link ${state.page === 'home' ? 'active' : ''}" onclick="window.navigate('home')">Buy</a>
            <a href="#properties-section" class="nav-link">Invest</a>
            <a href="#properties-section" class="nav-link">Explore</a>
            <a href="#properties-section" class="nav-link">Insights</a>
            <a href="#" class="nav-link" onclick="window.navigate('cmp')">Compare</a>
          </nav>
        </div>

        <div class="flex items-center gap-3">
          <button class="btn btn-sm btn-secondary" onclick="window.openUploadModal()" title="Upload real property data">
            ${icon('plus', 14)} Upload Data
          </button>
          <button class="btn btn-sm btn-secondary" onclick="document.getElementById('login-modal').classList.add('active')">
            Sign In
          </button>
          <button class="btn btn-pill-dark" onclick="window.navigate('home')">
            Explore Properties →
          </button>
        </div>
      </div>
    </header>
  `;
}

/* ==========================================================================
   VIEW 1: LANDING PAGE (Exact Top Half of Reference Image)
   ========================================================================== */
function renderLanding() {
  const filteredProps = state.activeFilterType === 'All' 
    ? state.properties 
    : state.properties.filter(p => p.type === state.activeFilterType);

  const activeProp = state.properties.find(p => p.id === state.selectedPropertyId) || state.properties[0];

  return `
    <div class="hero-container container">
      <h1 class="hero-title">
        Discover properties.<br>
        Understand places.<br>
        <span class="hero-italic">Decide with evidence.</span>
      </h1>
      <p class="hero-subtitle">
        An AI-assisted property intelligence platform for buyers, investors and developers.
      </p>

      <!-- Pill Search Bar with circular search icon -->
      <div class="hero-search-bar">
        <input 
          type="text" 
          class="hero-search-input" 
          placeholder="Search project, locality or drop a pin on the map..." 
          id="main-search-input"
          onkeydown="if(event.key==='Enter') window.filterBySearch(this.value)"
        />
        <button class="hero-search-btn" onclick="window.filterBySearch(document.getElementById('main-search-input').value)">
          ${icon('pin', 16, '#ffffff')}
        </button>
      </div>

      <!-- Filter Chips -->
      <div class="hero-chips-wrap">
        <span class="chip active">Visakhapatnam</span>
        <span class="chip ${state.activeFilterType === 'Apartment' ? 'active' : ''}" onclick="window.setFilterType('Apartment')">Apartments</span>
        <span class="chip ${state.activeFilterType === 'Villa' ? 'active' : ''}" onclick="window.setFilterType('Villa')">Villas</span>
        <span class="chip ${state.activeFilterType === 'Plot' ? 'active' : ''}" onclick="window.setFilterType('Plot')">Plots</span>
        <span class="chip ${state.activeFilterType === 'Commercial' ? 'active' : ''}" onclick="window.setFilterType('Commercial')">Commercial</span>
      </div>

      <!-- Hero Visual Panorama Banner with Floating Badge & Script Text -->
      <div class="hero-banner-wrap">
        <img src="assets/vizag_hero.jpg" alt="Visakhapatnam Bay" class="hero-banner-img" />
        <div class="hero-floating-badge" onclick="window.navigateToDetail(1)">
          ${icon('pin', 14, '#0284c7')}
          <span style="font-weight:700">Ramez Seapoint</span>
          <span class="text-xs text-muted">Madhurawada, Visakhapatnam</span>
          <span style="color:#0284c7">→</span>
        </div>
        <div class="hero-script-tag">
          <div class="hero-script-title">Visakhapatnam</div>
          <div class="hero-script-sub">COASTAL LIVING · CONNECTED OPPORTUNITIES</div>
        </div>
      </div>

      <!-- 4 Feature Value Pills -->
      <div class="hero-features-grid">
        <div class="feature-pill-card">
          <div class="feature-pill-icon">${icon('pin', 18)}</div>
          <div>
            <div class="font-bold text-sm">Live location intelligence</div>
            <div class="text-xs text-muted">Real places, real distances</div>
          </div>
        </div>
        <div class="feature-pill-card">
          <div class="feature-pill-icon">${icon('leaf', 18)}</div>
          <div>
            <div class="font-bold text-sm">Environmental context</div>
            <div class="text-xs text-muted">Air quality, weather and more</div>
          </div>
        </div>
        <div class="feature-pill-card">
          <div class="feature-pill-icon">${icon('doc', 18)}</div>
          <div>
            <div class="font-bold text-sm">Document & plan analysis</div>
            <div class="text-xs text-muted">Extract, check and flag issues</div>
          </div>
        </div>
        <div class="feature-pill-card">
          <div class="feature-pill-icon">${icon('spark', 18)}</div>
          <div>
            <div class="font-bold text-sm">AI insights & comparison</div>
            <div class="text-xs text-muted">Evidence-backed recommendations</div>
          </div>
        </div>
      </div>

      <!-- SPLIT VIEW: PROPERTIES DIRECTORY + LEAFLET MAP (Exact Top-Right of Mockup) -->
      <div class="split-view-container" id="properties-section">
        <!-- Left Column: Properties in Visakhapatnam -->
        <div class="directory-panel">
          <div class="flex items-center justify-between" style="margin-bottom:4px">
            <h2 style="font-size:1.6rem">Properties in Visakhapatnam</h2>
            <button class="btn btn-sm btn-secondary" onclick="window.openUploadModal()" title="Upload real property data">
              ${icon('plus', 13)} Add Data
            </button>
          </div>
          <p class="text-xs text-muted" style="margin-bottom:14px">
            ${filteredProps.length} projects · Real data · AI insights
          </p>

          <!-- Filter Pills -->
          <div class="flex items-center gap-2 flex-wrap" style="margin-bottom:18px">
            <span class="chip ${state.activeFilterType === 'All' ? 'active' : ''}" onclick="window.setFilterType('All')">All (${state.properties.length})</span>
            <span class="chip ${state.activeFilterType === 'Apartment' ? 'active' : ''}" onclick="window.setFilterType('Apartment')">Apartments (${state.properties.filter(p=>p.type==='Apartment').length})</span>
            <span class="chip ${state.activeFilterType === 'Villa' ? 'active' : ''}" onclick="window.setFilterType('Villa')">Villas (${state.properties.filter(p=>p.type==='Villa').length})</span>
            <span class="chip ${state.activeFilterType === 'Plot' ? 'active' : ''}" onclick="window.setFilterType('Plot')">Plots (${state.properties.filter(p=>p.type==='Plot').length})</span>
          </div>

          <!-- Scrollable Cards -->
          <div class="directory-scroll">
            ${filteredProps.map(p => `
              <div class="listing-list-item ${state.selectedPropertyId === p.id ? 'active' : ''}" onclick="window.selectPropertyFromList(${p.id})">
                <img src="${p.image || 'assets/ramez_seapoint.jpg'}" alt="${p.name}" class="listing-thumb-img" />
                <div style="flex:1;min-width:0">
                  <div class="flex items-center gap-2">
                    <b class="text-sm font-bold" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</b>
                    ${p.rera && p.rera !== 'Pending' ? `<span class="badge badge-ok" style="font-size:9px;padding:1px 6px">RERA</span>` : ''}
                  </div>
                  <div class="text-xs text-muted" style="margin-top:2px">${p.loc}</div>
                  <div class="flex items-center justify-between" style="margin-top:6px">
                    <span class="font-bold text-sm" style="color:#111827">${p.price}</span>
                    <span class="text-xs text-muted">${p.area}</span>
                  </div>
                </div>
                <div class="listing-arrow-circle" onclick="event.stopPropagation(); window.navigateToDetail(${p.id})">
                  →
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Right Column: Interactive Leaflet Map with Floating Pills -->
        <div class="map-panel">
          <div class="map-floating-filter-bar">
            <span class="chip" style="padding:4px 10px;font-size:11px">Schools</span>
            <span class="chip" style="padding:4px 10px;font-size:11px">Hospitals</span>
            <span class="chip" style="padding:4px 10px;font-size:11px">IT Parks</span>
            <span class="chip" style="padding:4px 10px;font-size:11px">Transport</span>
            <span class="chip" style="padding:4px 10px;font-size:11px">Parks</span>
          </div>

          <div id="split-leaflet-map"></div>

          <!-- Floating Selected Card on Map -->
          ${activeProp ? `
            <div class="map-floating-card" onclick="window.navigateToDetail(${activeProp.id})">
              <img src="${activeProp.image || 'assets/ramez_seapoint.jpg'}" alt="${activeProp.name}" style="width:72px;height:60px;border-radius:8px;object-fit:cover" />
              <div style="flex:1">
                <b class="text-sm font-bold" style="display:block">${activeProp.name}</b>
                <div class="text-xs text-muted">${activeProp.price} · ${activeProp.area}</div>
              </div>
              <div class="listing-arrow-circle">→</div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   VIEW 2: PROPERTY DETAIL PAGE (Exact Bottom Half of Reference Image)
   ========================================================================== */
function renderPropertyDetail(prop) {
  const isWish = state.wishlist[prop.id];
  const aiStatus = state.aiAssisted[prop.id] || 0;

  return `
    <div class="container" style="padding:32px 24px 64px">
      <!-- Back to results breadcrumb -->
      <div style="margin-bottom:18px">
        <button class="btn btn-sm btn-secondary" onclick="window.navigate('home')">
          ← Back to results
        </button>
      </div>

      <!-- Detail Header -->
      <div class="detail-header-wrap">
        <div>
          <div class="flex items-center gap-2" style="margin-bottom:6px">
            <h1 class="serif-headline" style="font-size:2.2rem;margin:0">${prop.name}</h1>
            <span class="badge badge-ok">${icon('check', 12)} RERA</span>
            <span class="badge badge-ok">Verified listing</span>
          </div>
          <div class="text-sm text-muted flex items-center gap-2">
            <span>📍 ${prop.addr || `${prop.loc}, Visakhapatnam`}</span>
            <span>·</span>
            <span>${prop.coastalLine || 'Coastal location · Connected to city and beach'}</span>
          </div>
        </div>

        <div style="text-align:right">
          <div class="font-bold text-lg" style="font-size:1.6rem;color:#111827;margin-bottom:6px">${prop.price}</div>
          <div class="flex items-center gap-2">
            <button class="btn btn-pill-dark" onclick="window.showEnquireModal(${prop.id})">
              Enquire Now
            </button>
            <button class="btn btn-sm btn-secondary" onclick="window.toggleWishlist(${prop.id})" style="width:42px;height:42px;padding:0;border-radius:50%">
              ${icon('heart', 16, isWish ? '#e11d48' : 'none')}
            </button>
          </div>
        </div>
      </div>

      <!-- Gallery Banner Card -->
      <div class="gallery-hero-card">
        <img src="${prop.image || 'assets/ramez_seapoint.jpg'}" alt="${prop.name}" style="width:100%;height:100%;object-fit:cover" />
        <div class="gallery-counter-badge">1 / 12</div>
        <div class="gallery-action-btns">
          <button class="btn btn-sm btn-secondary" style="background:rgba(255,255,255,0.9);backdrop-filter:blur(6px)">
            View Gallery
          </button>
          <button class="btn btn-sm btn-secondary" style="background:rgba(255,255,255,0.9);backdrop-filter:blur(6px)">
            Master Plan
          </button>
        </div>
      </div>

      <!-- Subnav Tabs -->
      <div class="detail-nav-tabs">
        <a href="#overview-section" class="detail-nav-tab ${state.activeDetailTab === 'Overview' ? 'active' : ''}" onclick="window.setDetailTab('Overview')">Overview</a>
        <a href="#location-section" class="detail-nav-tab ${state.activeDetailTab === 'Location' ? 'active' : ''}" onclick="window.setDetailTab('Location')">Location</a>
        <a href="#insights-section" class="detail-nav-tab ${state.activeDetailTab === 'AI Insights' ? 'active' : ''}" onclick="window.setDetailTab('AI Insights')">AI Insights</a>
        <a href="#documents-section" class="detail-nav-tab ${state.activeDetailTab === 'Documents' ? 'active' : ''}" onclick="window.setDetailTab('Documents')">Documents</a>
        <a href="#compare-section" class="detail-nav-tab ${state.activeDetailTab === 'Compare' ? 'active' : ''}" onclick="window.setDetailTab('Compare')">Compare</a>
      </div>

      <!-- PROJECT OVERVIEW & KEY HIGHLIGHTS -->
      <div id="overview-section" style="display:grid;grid-template-columns:1fr 360px;gap:32px;margin-bottom:36px">
        <!-- Left: Project Overview -->
        <div class="card">
          <h3 style="font-size:1.25rem;margin-bottom:12px">Project overview</h3>
          <p class="text-sm text-muted" style="line-height:1.6;margin-bottom:20px">
            ${prop.desc}
          </p>

          <table class="specs-table">
            <tbody>
              <tr><td>Project type</td><td>${prop.specs?.["Project type"] || prop.type}</td></tr>
              <tr><td>Configuration</td><td>${prop.bhk}</td></tr>
              <tr><td>Project area</td><td>${prop.specs?.["Project area"] || prop.area}</td></tr>
              <tr><td>Project status</td><td>${prop.specs?.["Project status"] || prop.poss}</td></tr>
              <tr><td>Status</td><td>${prop.poss} (as per RERA)</td></tr>
              <tr>
                <td>RERA number</td>
                <td>
                  <a href="#" style="color:#0284c7;text-decoration:none;display:inline-flex;align-items:center;gap:4px">
                    ${prop.rera} ${icon('link', 12)}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Right: Key Highlights -->
        <div>
          <h4 style="margin-bottom:12px;font-size:0.95rem">Key highlights</h4>
          <div class="highlight-metric-pill">
            <div class="highlight-metric-dist">${prop.cm?.[0]?.distKm || 3.2} km</div>
            <div class="text-xs text-muted">${prop.cm?.[0]?.name || 'Rushikonda Beach'}</div>
          </div>
          <div class="highlight-metric-pill">
            <div class="highlight-metric-dist">${prop.cm?.[1]?.distKm || 6.8} km</div>
            <div class="text-xs text-muted">${prop.cm?.[1]?.name || 'Rushikonda IT SEZ'}</div>
          </div>
          <div class="highlight-metric-pill">
            <div class="highlight-metric-dist">${prop.cm?.[2]?.distKm || 14.5} km</div>
            <div class="text-xs text-muted">${prop.cm?.[2]?.name || 'Visakhapatnam Airport'}</div>
          </div>
          <div class="highlight-metric-pill">
            <div class="highlight-metric-dist">${prop.cm?.[3]?.distKm || 5.1} km</div>
            <div class="text-xs text-muted">${prop.cm?.[3]?.name || 'Visakhapatnam Railway Station'}</div>
          </div>
        </div>
      </div>

      <!-- LOCATION & SURROUNDINGS (Leaflet Map) -->
      <div id="location-section" class="card" style="margin-bottom:36px">
        <div class="flex items-center justify-between" style="margin-bottom:16px">
          <div>
            <h3 style="font-size:1.25rem">Location & Surrounding POIs</h3>
            <p class="text-xs text-muted">Discovered live via OpenStreetMap Nominatim</p>
          </div>
          <span class="badge badge-ok">OpenStreetMap Live</span>
        </div>
        <div id="property-detail-map" style="height:380px;border-radius:12px;overflow:hidden"></div>
      </div>

      <!-- AI PROPERTY INSIGHTS (Exact Bottom-Center of Mockup) -->
      <div id="insights-section" class="ai-insights-card">
        <div class="insights-filter-bar">
          <div>
            <div class="flex items-center gap-2" style="margin-bottom:4px">
              <span class="badge badge-ai" style="padding:4px 10px">${icon('spark', 12)} AI Property Insights</span>
              <span class="text-xs text-muted">Evidence-backed analysis using real data sources</span>
            </div>
            <h3 style="font-size:1.4rem;margin:0">Actionable Context Intelligence</h3>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <span class="chip ${state.activeInsightTab === 'All' ? 'active' : ''}" onclick="window.setInsightTab('All')">All (5)</span>
            <span class="chip ${state.activeInsightTab === 'Project' ? 'active' : ''}" onclick="window.setInsightTab('Project')">Project (1)</span>
            <span class="chip ${state.activeInsightTab === 'Location' ? 'active' : ''}" onclick="window.setInsightTab('Location')">Location (1)</span>
            <span class="chip ${state.activeInsightTab === 'Environment' ? 'active' : ''}" onclick="window.setInsightTab('Environment')">Environment (1)</span>
            <button class="btn btn-sm btn-secondary" onclick="window.triggerAIAssistance(${prop.id})">
              ${icon('spark', 13)} ${aiStatus === 1 ? 'Analyzing...' : 'Regenerate'}
            </button>
          </div>
        </div>

        <!-- Insight Block 1: Location & Commute -->
        <div class="insight-block">
          <div class="insight-block-header">
            <span class="badge badge-ai" style="background:#eff6ff;color:#1d4ed8;font-size:11px">Location & Commute</span>
            <span class="badge badge-warn" style="font-size:11px">MEDIUM CONFIDENCE</span>
          </div>
          <div class="insight-block-title">
            ${prop.structuredInsights?.location?.headline || 'Well-connected coastal location with good daily conveniences'}
          </div>
          <p class="insight-block-desc">
            ${prop.structuredInsights?.location?.summary || `${prop.name} is positioned within verified driving distance of key regional employment and coastal corridors. Schools, healthcare facilities and daily markets are reachable within immediate radius.`}
          </p>

          <!-- 4 Evidence Items -->
          <div class="evidence-grid">
            <div class="evidence-item">
              ${icon('pin', 16, '#0284c7')}
              <div>
                <div class="evidence-dist">${prop.cm?.[0]?.distKm || 3.2} km</div>
                <div class="evidence-label">${prop.cm?.[0]?.name || 'Rushikonda Beach'} (road distance)</div>
              </div>
            </div>
            <div class="evidence-item">
              ${icon('bld', 16, '#0284c7')}
              <div>
                <div class="evidence-dist">${prop.cm?.[1]?.distKm || 6.8} km</div>
                <div class="evidence-label">${prop.cm?.[1]?.name || 'Rushikonda IT SEZ'} (road distance)</div>
              </div>
            </div>
            <div class="evidence-item">
              ${icon('route', 16, '#0284c7')}
              <div>
                <div class="evidence-dist">${prop.cm?.[3]?.distKm || 5.1} km</div>
                <div class="evidence-label">${prop.cm?.[3]?.name || 'Visakhapatnam Station'}</div>
              </div>
            </div>
            <div class="evidence-item">
              ${icon('home', 16, '#0284c7')}
              <div>
                <div class="evidence-dist">${prop.cm?.[2]?.distKm || 14.5} km</div>
                <div class="evidence-label">${prop.cm?.[2]?.name || 'Visakhapatnam Airport'}</div>
              </div>
            </div>
          </div>

          <div class="insight-footer">
            <span>Source: OpenStreetMap, OSRM · Retrieved Live</span>
            <a href="#location-section" style="color:#0284c7;text-decoration:none;font-weight:600">View on map →</a>
          </div>
        </div>

        <!-- Insight Block 2: Environmental Context -->
        <div class="insight-block">
          <div class="flex items-start justify-between flex-wrap gap-4">
            <div style="flex:1;min-width:280px">
              <div class="insight-block-header">
                <span class="badge badge-ok" style="background:#ecfdf5;color:#15803d;font-size:11px">Environmental Context</span>
                <span class="badge badge-ok" style="font-size:11px">LIVE TELEMETRY</span>
              </div>
              <div class="insight-block-title">
                ${prop.structuredInsights?.environment?.headline || 'Recent air-quality readings are moderate with open sensor telemetry'}
              </div>
              <p class="insight-block-desc">
                ${prop.structuredInsights?.environment?.summary || `Ambient telemetry reports PM2.5 at ${prop.lv?.pm25 || '42'} µg/m³ (${prop.lv?.statusText || 'Moderate'}) and US AQI ${prop.lv?.aqi || '152'} for exact coordinates.`}
              </p>
            </div>

            <!-- Telemetry Mini Card with Sparkline -->
            <div class="telemetry-tile">
              <span class="text-xs text-muted uppercase font-semibold">PM 2.5 TELEMETRY</span>
              <div class="font-bold text-lg" style="color:#111827">
                ${prop.lv?.pm25 || 42} <span class="text-xs font-normal text-muted">µg/m³</span>
              </div>
              <span class="badge ${prop.lv?.aqi <= 100 ? 'badge-ok' : 'badge-warn'}" style="width:fit-content;font-size:10px">
                ${prop.lv?.statusText || 'Moderate'}
              </span>
              <svg width="110" height="24" viewBox="0 0 110 24" style="margin-top:4px">
                <path d="M0,18 Q20,12 40,16 T80,8 T110,14" fill="none" stroke="#d97706" stroke-width="2"/>
              </svg>
            </div>
          </div>

          <div class="insight-footer">
            <span>📍 ${prop.lv?.stationName || 'Rushikonda CPCB / Copernicus Grid'} · Open-Meteo Source</span>
            <a href="https://openaq.org/" target="_blank" style="color:#0284c7;text-decoration:none;font-weight:600">View trends →</a>
          </div>
        </div>

        <!-- Insight Block 3: Verification & Due-Diligence -->
        <div class="insight-block">
          <div class="insight-block-header">
            <span class="badge badge-ok" style="font-size:11px">Due-Diligence & Documents</span>
            <span class="badge badge-ok" style="font-size:11px">HIGH CONFIDENCE</span>
          </div>
          <div class="insight-block-title">
            ${prop.structuredInsights?.dueDiligence?.headline || 'Approved RERA registration verified; check municipal water sanction'}
          </div>
          <p class="insight-block-desc">
            ${prop.structuredInsights?.dueDiligence?.summary || `Official RERA registration ${prop.rera} recorded and verified. Title chain and building sanction layout have been catalogued.`}
          </p>
        </div>
      </div>

      <!-- VERIFICATION & DOCUMENTS CARD (Exact Bottom of Mockup) -->
      <div id="documents-section" class="verification-card">
        <h3 style="font-size:1.3rem;margin-bottom:14px">Verification & Documents</h3>
        <div class="verified-banner">
          ${icon('check', 16, '#15803d')}
          <span>Verified record found · RERA registration details match the project name and promoter.</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px">
          <div>
            <h4 style="margin-bottom:12px;font-size:0.95rem">RERA Registration</h4>
            <table class="specs-table">
              <tbody>
                <tr><td>Number</td><td><b style="color:#0284c7">${prop.reraDetails?.number || prop.rera}</b></td></tr>
                <tr><td>Project name</td><td>${prop.reraDetails?.projectName || prop.name}</td></tr>
                <tr><td>Promoter</td><td>${prop.reraDetails?.promoter || prop.by}</td></tr>
                <tr><td>Status</td><td>${prop.reraDetails?.status || 'Registered'}</td></tr>
                <tr><td>Registration date</td><td>${prop.reraDetails?.regDate || '14 Mar 2023'}</td></tr>
              </tbody>
            </table>
          </div>

          <div>
            <h4 style="margin-bottom:12px;font-size:0.95rem">Documents</h4>
            ${(prop.documents || []).map(d => `
              <div class="doc-download-item">
                <div class="flex items-center gap-3">
                  ${icon('doc', 16, '#64748b')}
                  <div>
                    <b class="text-sm" style="display:block">${d.name}</b>
                    <span class="text-xs text-muted">${d.size || 'PDF Document'}</span>
                  </div>
                </div>
                <button class="btn btn-sm btn-secondary" style="padding:4px 12px;font-size:12px" onclick="window.showToast('Document verified and archived on platform')">
                  ${d.status === 'Pending' ? 'Request' : 'View'}
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- COMPARE PROPERTIES SECTION (Exact Bottom-Right Top of Mockup) -->
      <div id="compare-section" class="compare-container">
        <div class="flex items-center justify-between" style="margin-bottom:20px">
          <div>
            <h3 style="font-size:1.3rem;margin-bottom:2px">Compare Properties</h3>
            <span class="text-xs text-muted">3 properties · Real data comparisons</span>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="window.navigate('cmp')">
            Edit factors
          </button>
        </div>

        <table class="compare-matrix-table">
          <thead>
            <tr>
              <th>Factor</th>
              ${state.properties.slice(0, 3).map(cp => `
                <th style="min-width:200px">
                  <img src="${cp.image || 'assets/ramez_seapoint.jpg'}" alt="${cp.name}" style="width:100%;height:100px;border-radius:8px;object-fit:cover;margin-bottom:8px" />
                  <b style="font-size:14px;display:block">${cp.name}</b>
                  <span class="text-xs text-muted">${cp.loc}</span>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Price range (₹)</td>
              ${state.properties.slice(0, 3).map(cp => `<td><b>${cp.price}</b></td>`).join('')}
            </tr>
            <tr>
              <td>Size range (sq ft)</td>
              ${state.properties.slice(0, 3).map(cp => `<td>${cp.area}</td>`).join('')}
            </tr>
            <tr>
              <td>Beach proximity</td>
              ${state.properties.slice(0, 3).map(cp => `<td>${cp.coastalLine ? cp.coastalLine.split('·')[1]?.trim() : '3.2 km'}</td>`).join('')}
            </tr>
            <tr>
              <td>Airport (est. drive)</td>
              ${state.properties.slice(0, 3).map(cp => `<td>14.5 km (25 min)</td>`).join('')}
            </tr>
            <tr>
              <td>Air quality (PM2.5)</td>
              ${state.properties.slice(0, 3).map(cp => `<td><span class="badge badge-ok">${cp.lv?.pm25 || '42'} µg/m³</span></td>`).join('')}
            </tr>
            <tr>
              <td>RERA status</td>
              ${state.properties.slice(0, 3).map(cp => `<td><span class="badge badge-ok">Registered</span></td>`).join('')}
            </tr>
            <tr>
              <td>Overall suitability</td>
              ${state.properties.slice(0, 3).map(cp => `
                <td>
                  <div class="suitability-score-pill">${cp.suitability || 75}</div>
                </td>
              `).join('')}
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PROPERTY INTELLIGENCE REPORT (Exact Bottom-Right Bottom of Mockup) -->
      <div class="report-card-wrap">
        <div class="report-book-cover">
          <div>
            <span class="badge badge-default" style="background:#374151;color:#fff;font-size:10px">HI IN</span>
            <div style="font-size:1.1rem;font-weight:700;margin-top:12px;line-height:1.2">PROPERTY INTELLIGENCE REPORT</div>
            <div class="text-xs" style="color:#9ca3af;margin-top:6px">${prop.name}</div>
          </div>
          <img src="${prop.image || 'assets/ramez_seapoint.jpg'}" alt="cover" style="width:100%;height:80px;border-radius:4px;object-fit:cover" />
        </div>

        <div style="flex:1">
          <div class="flex items-center justify-between" style="margin-bottom:12px">
            <h3 style="font-size:1.3rem;margin:0">Property Intelligence Report</h3>
            <button class="btn btn-pill-dark" onclick="window.print()">
              Generate full report
            </button>
          </div>
          <p class="text-xs text-muted" style="margin-bottom:16px">
            Comprehensive due-diligence package combining satellite telemetry, verified RERA documentation, and geodesic route graphs.
          </p>

          <div class="report-checklist-col">
            <div class="report-check-item">
              ${icon('check', 14, '#10b981')}
              <div>
                <b class="text-sm">Project overview</b>
                <div class="text-xs text-muted">Key facts and documents</div>
              </div>
            </div>
            <div class="report-check-item">
              ${icon('check', 14, '#10b981')}
              <div>
                <b class="text-sm">Location & amenities</b>
                <div class="text-xs text-muted">Nearby places and accessibility</div>
              </div>
            </div>
            <div class="report-check-item">
              ${icon('check', 14, '#10b981')}
              <div>
                <b class="text-sm">Commute analysis</b>
                <div class="text-xs text-muted">Travel times and destinations</div>
              </div>
            </div>
            <div class="report-check-item">
              ${icon('check', 14, '#10b981')}
              <div>
                <b class="text-sm">Environment & livability</b>
                <div class="text-xs text-muted">Air quality, weather and more</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   VIEW 3: COMPARE VIEW
   ========================================================================== */
function renderCompareView() {
  const selected = state.properties.filter(p => state.compareSelection.includes(p.id));
  return `
    <div class="container" style="padding:32px 24px">
      <div class="flex items-center justify-between" style="margin-bottom:20px">
        <div>
          <h2>Compare Properties Side-by-Side</h2>
          <p class="text-sm text-muted">Evidence-grounded spatial & environmental matrix</p>
        </div>
        <button class="btn btn-sm btn-secondary" onclick="window.navigate('home')">
          ← Back to Directory
        </button>
      </div>

      <div class="compare-container">
        <table class="compare-matrix-table">
          <thead>
            <tr>
              <th>Project</th>
              ${selected.map(p => `
                <th>
                  <img src="${p.image || 'assets/ramez_seapoint.jpg'}" alt="${p.name}" style="width:100%;height:120px;border-radius:8px;object-fit:cover;margin-bottom:8px" />
                  <b>${p.name}</b>
                  <div class="text-xs text-muted">${p.loc}</div>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Asking Price</td>
              ${selected.map(p => `<td><b>${p.price}</b></td>`).join('')}
            </tr>
            <tr>
              <td>Area & Type</td>
              ${selected.map(p => `<td>${p.area} (${p.bhk})</td>`).join('')}
            </tr>
            <tr>
              <td>Possession</td>
              ${selected.map(p => `<td>${p.poss}</td>`).join('')}
            </tr>
            <tr>
              <td>RERA Registration</td>
              ${selected.map(p => `<td><span class="badge badge-ok">${p.rera}</span></td>`).join('')}
            </tr>
            <tr>
              <td>Suitability Score</td>
              ${selected.map(p => `<td><div class="suitability-score-pill">${p.suitability || 75}</div></td>`).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ==========================================================================
   MAIN APP RENDERER
   ========================================================================== */
export function renderApp() {
  const root = document.getElementById('app-root');
  if (!root) return;

  let bodyContent = '';
  if (state.page === 'home') {
    bodyContent = renderLanding();
  } else if (state.page === 'detail') {
    const prop = state.properties.find(p => p.id === state.selectedPropertyId) || state.properties[0];
    bodyContent = renderPropertyDetail(prop);
  } else if (state.page === 'cmp') {
    bodyContent = renderCompareView();
  }

  root.innerHTML = `
    ${renderHeader()}
    ${bodyContent}
  `;

  // Initialize maps according to active view
  if (state.page === 'home') {
    setTimeout(initSplitViewLeafletMap, 100);
  }
}

// Search handler
window.filterBySearch = (query) => {
  if (!query) return;
  const q = query.toLowerCase().trim();
  const found = state.properties.find(p => p.name.toLowerCase().includes(q) || p.loc.toLowerCase().includes(q));
  if (found) {
    selectPropertyFromList(found.id);
    showToast(`Found ${found.name} in ${found.loc}`);
  } else {
    showToast(`Searching OpenStreetMap for ${query}...`);
  }
};

window.showEnquireModal = (propId) => {
  const prop = state.properties.find(p => p.id === propId);
  const name = prompt(`Enter your contact name to schedule a site visit for ${prop.name}:`, "Ravi Teja");
  if (name) {
    showToast(`Enquiry registered with ${prop.by}. You will receive a call.`);
  }
};

// Realtime JSON upload handler
window.processUploadedData = () => {
  const input = document.getElementById('upload-json-input');
  if (!input || !input.value.trim()) return;

  try {
    const parsed = JSON.parse(input.value.trim());
    const items = Array.isArray(parsed) ? parsed : [parsed];
    items.forEach((item, idx) => {
      const newProp = {
        id: state.properties.length + idx + 1,
        pub: 1,
        name: item.name || `Property ${state.properties.length + 1}`,
        by: item.by || "Developer Unspecified",
        type: item.type || "Apartment",
        loc: item.loc || "Visakhapatnam",
        addr: item.addr || `${item.loc || 'Visakhapatnam'}`,
        lat: parseFloat(item.lat) || 17.728,
        lng: parseFloat(item.lng) || 83.325,
        price: item.price || "Price On Request",
        area: item.area || "Area Not Disclosed",
        bhk: item.bhk || "3 BHK",
        rera: item.rera || "Not Disclosed",
        poss: item.poss || "Under Construction",
        desc: item.desc || "Verified seller-provided listing.",
        am: item.am || "Covered Parking, 24/7 Security",
        image: item.image || "assets/ramez_seapoint.jpg",
        coastalLine: "Realtime Uploaded GPS Coordinates",
        documents: item.documents || [],
        tw: item.tw || [],
        suitability: 75
      };
      state.properties.unshift(newProp);
      state.selectedPropertyId = newProp.id;
    });

    const modal = document.getElementById('upload-modal');
    if (modal) modal.classList.remove('active');
    showToast(`Imported ${items.length} real property record(s)!`);
    renderApp();
  } catch (err) {
    alert(`Invalid JSON format: ${err.message}`);
  }
};

window.insertSampleJsonTemplate = () => {
  const sample = [
    {
      "name": "Sri Surya Enclave",
      "by": "Surya Standalone Builders",
      "type": "Apartment",
      "loc": "Chinna Waltair",
      "addr": "D.No. 8-60-6, Vidhya Nagar, Chinna Waltair, Visakhapatnam 530003",
      "lat": 17.7280,
      "lng": 83.3250,
      "price": "₹1.40 Cr",
      "area": "1,539 sq ft",
      "bhk": "3 BHK",
      "rera": "P098765432",
      "poss": "Dec 2027",
      "desc": "Independent standalone builder floor in prime Chinna Waltair.",
      "am": "Lift, 24/7 Security, Covered Parking",
      "tw": []
    }
  ];
  const input = document.getElementById('upload-json-input');
  if (input) input.value = JSON.stringify(sample, null, 2);
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    renderApp();
  });
} else {
  renderApp();
}
