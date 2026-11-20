import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Heart,
  Columns,
  Navigation,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Bookmark,
  Check,
  ArrowRight,
  MapPin,
  ExternalLink,
  Trash2,
  Share2,
  CheckSquare,
  Square
} from 'lucide-react';

interface ShortlistedProject {
  id: string;
  propId: number;
  name: string;
  location: string;
  builder: string;
  possession: string;
  bhks: string[];
  acres: string;
  towers: string;
  commuteTime: string;
  commuteDest: string;
  price: string;
  rate: string;
  image: string;
}

const INITIAL_SHORTLISTED_PROJECTS: ShortlistedProject[] = [
  {
    id: 'ramky',
    propId: 1,
    name: 'Ramky Kingston Park Orbit',
    location: 'Gopanapally',
    builder: 'Ramky Estates',
    possession: 'Possession Jun 2027',
    bhks: ['2', '3'],
    acres: '16.5',
    towers: '6',
    commuteTime: '22',
    commuteDest: 'Wipro Circle (Office)',
    price: '₹1.12 – 1.62 Cr',
    rate: '₹8,600 / sq ft',
    image: '/design/buyer-1.jpeg'
  },
  {
    id: 'aurelia',
    propId: 4,
    name: 'Aurelia Heights',
    location: 'Puppalaguda',
    builder: 'Aurelia Developers',
    possession: 'Possession Mar 2028',
    bhks: ['3', '4'],
    acres: '7.2',
    towers: '4',
    commuteTime: '14',
    commuteDest: 'Wipro Circle (Office)',
    price: '₹1.58 – 2.30 Cr',
    rate: '₹9,900 / sq ft',
    image: '/design/buyer-2.jpeg'
  },
  {
    id: 'sattva',
    propId: 5,
    name: 'Sattva Greenwood',
    location: 'Kokapet',
    builder: 'Sattva Group',
    possession: 'Ready to move',
    bhks: ['3', '4'],
    acres: '11',
    towers: '5',
    commuteTime: '25',
    commuteDest: 'Wipro Circle (Office)',
    price: '₹1.52 – 2.65 Cr',
    rate: '₹10,800 / sq ft',
    image: '/design/buyer-3.jpeg'
  }
];

export const DashboardPage: React.FC<{ initialTab?: string }> = ({ initialTab = 'projects' }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tabParam = searchParams.get('tab') || initialTab;
  const [activeTab, setActiveTab] = useState<'projects' | 'units' | 'comparison' | 'commute' | 'settings'>(
    (tabParam as any) || 'projects'
  );

  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(['ramky', 'aurelia', 'sattva']);
  const [projects, setProjects] = useState<ShortlistedProject[]>(INITIAL_SHORTLISTED_PROJECTS);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleRemoveProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjects(prev => prev.filter(p => p.id !== id));
    setSelectedIds(prev => prev.filter(x => x !== id));
  };

  const handleCompareClick = () => {
    setActiveTab('comparison');
  };

  return (
    <div className={`buyer-shell ${panelCollapsed ? 'panel-collapsed' : ''} ${activeTab === 'comparison' ? 'buyer-shell--comparison' : ''}`}>
      {/* Left Sidebar matching Image 3 */}
      <aside className="dashboard-panel" aria-label="Dashboard navigation">
        <div className="dashboard-panel-title">
          <strong>{!panelCollapsed && 'Dashboard'}</strong>
          <button
            type="button"
            className="icon-button"
            aria-label={panelCollapsed ? 'Expand side panel' : 'Collapse side panel'}
            onClick={() => setPanelCollapsed(!panelCollapsed)}
          >
            <PanelLeftClose size={17} />
          </button>
        </div>

        {/* Shortlists Section */}
        <button
          type="button"
          className={`panel-shortlists ${['projects', 'units'].includes(activeTab) ? 'active' : ''}`}
          title="Shortlists"
          onClick={() => setActiveTab('projects')}
        >
          <Heart size={17} />
          <strong>Shortlists</strong>
        </button>

        {/* Projects Sub-item */}
        <button
          type="button"
          title="Saved projects"
          className={`panel-sub ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <span>Projects</span>
          <small>{projects.length}</small>
        </button>

        {/* Units Sub-item */}
        <button
          type="button"
          title="Saved units"
          className={`panel-sub ${activeTab === 'units' ? 'active' : ''}`}
          onClick={() => setActiveTab('units')}
        >
          <span>Units</span>
          <small>0</small>
        </button>

        {/* Comparison Nav item */}
        <button
          type="button"
          title="Comparison"
          className={activeTab === 'comparison' ? 'active' : ''}
          onClick={() => setActiveTab('comparison')}
        >
          <Columns size={17} />
          <span>Comparison</span>
        </button>

        {/* My Commute Nav item */}
        <button
          type="button"
          title="My Commute"
          className={activeTab === 'commute' ? 'active' : ''}
          onClick={() => setActiveTab('commute')}
        >
          <Navigation size={17} />
          <span>My Commute</span>
        </button>

        {/* Settings Nav item */}
        <button
          type="button"
          title="Settings"
          className={`panel-settings ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={17} />
          <span>Settings</span>
        </button>
      </aside>

      {/* Main Content matching Image 3 */}
      <main className="buyer-content">
        {activeTab === 'projects' && (
          <>
            <div className="buyer-heading">
              <div>
                <h1>Shortlists</h1>
                <p>Projects and units you've kept. Pick 2 to 5 projects to compare them side by side.</p>
              </div>
            </div>

            <div className="buyer-section-bar">
              <h2>Projects</h2>

              {/* The exact black bar matching Image 3! */}
              {selectedIds.length > 0 && (
                <div className="selection-actions" role="region" aria-label="Selected projects">
                  <span aria-live="polite">{selectedIds.length} selected</span>
                  <button type="button" onClick={handleClearSelection}>Clear</button>
                  <button
                    type="button"
                    className="button button--primary"
                    disabled={selectedIds.length < 2}
                    onClick={handleCompareClick}
                  >
                    Compare
                  </button>
                </div>
              )}
            </div>

            {/* List of Shortlisted Projects matching Image 3 */}
            {projects.length === 0 ? (
              <div className="buyer-empty p-12 text-center bg-white rounded-xl border border-[#dedede]">
                <Bookmark size={30} className="mx-auto text-slate-400 mb-3" />
                <h2 className="text-lg font-bold text-[#111111]">No projects saved yet</h2>
                <p className="text-xs text-slate-500 mb-4">
                  Tap the bookmark star on any project and it will be kept here, ready to compare.
                </p>
                <Link to="/directory" className="button button--primary inline-block">
                  Find projects
                </Link>
              </div>
            ) : (
              <div className="buyer-projects buyer-projects--shortlist">
                {projects.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <article key={p.id} className="buyer-project">
                      {/* Photo with Star bookmark */}
                      <div className="buyer-project-photo">
                        <img src={p.image} alt={p.name} />
                        <button
                          type="button"
                          className="icon-button"
                          title={`Remove ${p.name} from Shortlists`}
                          aria-label={`Remove ${p.name} from Shortlists`}
                          onClick={(e) => handleRemoveProject(p.id, e)}
                        >
                          <Bookmark size={16} fill="currentColor" />
                        </button>
                      </div>

                      {/* Name & builder */}
                      <div className="buyer-project-name">
                        <h3>{p.name}</h3>
                        <p>{p.location} · {p.builder}</p>
                        <small>{p.possession}</small>
                      </div>

                      {/* Specs & Commute */}
                      <div className="buyer-project-spec">
                        <div className="buyer-bhk">
                          {p.bhks.map((bhk) => (
                            <span key={bhk}>{bhk} BHK</span>
                          ))}
                        </div>
                        <p>
                          <span className="mobile-bhk">{p.bhks.join('–')} BHK · </span>
                          {p.acres} acres · {p.towers} towers
                        </p>
                        <small>
                          <Navigation size={13} className="inline mr-1" />
                          {p.commuteTime} mins to {p.commuteDest}
                        </small>
                      </div>

                      {/* Pricing */}
                      <div className="buyer-project-price">
                        <strong>{p.price}</strong>
                        <small>{p.rate}</small>
                      </div>

                      {/* Actions */}
                      <div className="buyer-project-actions">
                        <label>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(p.id)}
                          />
                          Compare
                        </label>
                        <button
                          type="button"
                          className="button button--compact"
                          onClick={() => navigate(`/properties/${p.propId}`)}
                        >
                          View project
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Tab 2: Units */}
        {activeTab === 'units' && (
          <>
            <div className="buyer-heading">
              <div>
                <h1>Shortlists</h1>
                <p>Saved unit layouts and configurations.</p>
              </div>
            </div>

            <div className="buyer-section-bar">
              <h2>Units</h2>
            </div>

            <div className="p-12 text-center bg-white rounded-xl border border-[#dedede] space-y-3">
              <Bookmark size={30} className="mx-auto text-slate-400" />
              <h2 className="text-lg font-bold text-[#111111]">No unit plans saved yet</h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Explore project unit plans and tap the bookmark button on 2 BHK or 3 BHK layouts to save them here.
              </p>
              <Link to="/properties/1#units" className="button button--primary inline-block text-xs">
                Browse Ramky Kingston Unit Plans
              </Link>
            </div>
          </>
        )}

        {/* Tab 3: Comparison */}
        {activeTab === 'comparison' && (
          <>
            <div className="buyer-heading">
              <div>
                <h1>Comparison</h1>
                <p className="comparison-description">Compare prices, spaces and specifications side by side.</p>
              </div>
              <button
                type="button"
                className="button button--secondary button--compact"
                onClick={() => setActiveTab('projects')}
              >
                ← Back to Shortlists
              </button>
            </div>

            <div className="overflow-x-auto bg-white rounded-xl border border-[#dedede] p-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#eee]">
                    <th className="py-3 px-4 font-bold text-slate-500 uppercase font-mono text-[11px] w-48">Specification</th>
                    {projects.map((p) => (
                      <th key={p.id} className="py-3 px-4 font-bold text-[#111111] text-sm">
                        {p.name}
                        <span className="block text-xs font-normal text-slate-500">{p.location}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f2f2]">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600">Price Range</td>
                    {projects.map((p) => (
                      <td key={p.id} className="py-3 px-4 font-bold text-[#10261a]">{p.price}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600">Rate / sq ft</td>
                    {projects.map((p) => (
                      <td key={p.id} className="py-3 px-4">{p.rate}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600">Configurations</td>
                    {projects.map((p) => (
                      <td key={p.id} className="py-3 px-4">{p.bhks.map(b => `${b} BHK`).join(', ')}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600">Site Area & Towers</td>
                    {projects.map((p) => (
                      <td key={p.id} className="py-3 px-4">{p.acres} acres · {p.towers} towers</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600">Commute to Wipro Circle</td>
                    {projects.map((p) => (
                      <td key={p.id} className="py-3 px-4 font-mono font-medium text-[#1e6b3a]">{p.commuteTime} mins</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600">Possession</td>
                    {projects.map((p) => (
                      <td key={p.id} className="py-3 px-4">{p.possession}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600">Action</td>
                    {projects.map((p) => (
                      <td key={p.id} className="py-3 px-4">
                        <Link to={`/properties/${p.propId}`} className="button button--secondary button--compact inline-block">
                          View details
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Tab 4: My Commute */}
        {activeTab === 'commute' && (
          <>
            <div className="buyer-heading">
              <div>
                <h1>My Commute</h1>
                <p>The places you go to most. Each card shows the time and distance from your closest shortlisted home.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Wipro Circle (Office)', area: 'Financial District', dist: '6.5 km', time: '14 - 22 mins' },
                { name: 'DLF Cyber City', area: 'Gachibowli', dist: '8.5 km', time: '20 - 28 mins' },
                { name: 'Oakridge International', area: 'Khajaguda', dist: '5.2 km', time: '12 - 16 mins' },
                { name: 'Rajiv Gandhi Intl Airport', area: 'Shamshabad', dist: '32 km', time: '38 - 45 mins' }
              ].map((c) => (
                <div key={c.name} className="p-5 bg-white rounded-xl border border-[#dedede] space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#111111]">{c.name}</h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#eef7f1] text-[#1e6b3a]">
                      {c.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{c.area} · {c.dist}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Tab 5: Settings / Account */}
        {activeTab === 'settings' && (
          <>
            <div className="buyer-heading">
              <div>
                <h1>Account & Preferences</h1>
                <p>Your details, what you're looking for and how we reach you.</p>
              </div>
            </div>

            <div className="max-w-xl bg-white p-6 rounded-xl border border-[#dedede] space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Full Name</label>
                <input
                  type="text"
                  defaultValue="Ananya Rao"
                  className="w-full p-2.5 rounded-lg border border-[#ddd] bg-[#fcfcfc]"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Email Address</label>
                <input
                  type="email"
                  defaultValue="ananya.rao@example.com"
                  className="w-full p-2.5 rounded-lg border border-[#ddd] bg-[#fcfcfc]"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Phone Number</label>
                <input
                  type="tel"
                  defaultValue="+91 98xxx xx210"
                  className="w-full p-2.5 rounded-lg border border-[#ddd] bg-[#fcfcfc]"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Preferred Localities in Hyderabad</label>
                <input
                  type="text"
                  defaultValue="Gopanapally, Kokapet, Tellapur, Puppalaguda"
                  className="w-full p-2.5 rounded-lg border border-[#ddd] bg-[#fcfcfc]"
                />
              </div>
              <div className="pt-2">
                <button type="button" className="button button--primary">
                  Save Changes
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Powered by Netlify Floating Pill */}
      <div className="fixed bottom-4 right-4 z-40">
        <a
          href="https://portal-property.netlify.app"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-full bg-[#10261a] text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-lg hover:bg-[#1e6b3a] transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-[#8bcaa0]"></span>
          <span>Powered by Netlify</span>
        </a>
      </div>
    </div>
  );
};
