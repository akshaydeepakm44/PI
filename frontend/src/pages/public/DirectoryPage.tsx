import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { propertyApi } from '../../services/api';
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
  ArrowRight
} from 'lucide-react';

interface ProjectListItem {
  id: number;
  slug: string;
  name: string;
  city: string;
  location: string;
  builder: string;
  possession: string;
  status: string;
  bhk: string;
  acres: string;
  homes: string;
  floors: string;
  towers: string;
  price: string;
  rate: string;
  gallery: string[];
  configs: {
    bhk: number;
    price: string;
    size: string;
  }[];
}

const PROJECTS_DATA: ProjectListItem[] = [
  {
    id: 1,
    slug: 'ramky',
    name: 'Ramky Kingston Park Orbit',
    city: 'Hyderabad',
    location: 'Gopanapally',
    builder: 'Ramky Estates',
    possession: 'Possession Jun 2027',
    status: 'Under construction',
    bhk: '2–3',
    acres: '16.5',
    homes: '1,406',
    floors: '24',
    towers: '6',
    price: '₹1.12 – 1.62 Cr',
    rate: '₹8,600 / sq ft',
    gallery: ['/design/buyer-1.jpeg', '/design/clubhouse.jpeg', '/design/garden.jpeg', '/design/entrance.jpeg'],
    configs: [
      { bhk: 2, price: '1.12 Cr', size: '1,300 sq ft' },
      { bhk: 3, price: '1.62 Cr', size: '1,880 sq ft' }
    ]
  },
  {
    id: 4,
    slug: 'aurelia',
    name: 'Aurelia Heights',
    city: 'Hyderabad',
    location: 'Puppalaguda',
    builder: 'Aurelia Developers',
    possession: 'Possession Mar 2028',
    status: 'Under construction',
    bhk: '3–4',
    acres: '7.2',
    homes: '580',
    floors: '28',
    towers: '4',
    price: '₹1.58 – 2.30 Cr',
    rate: '₹9,900 / sq ft',
    gallery: ['/design/buyer-2.jpeg', '/design/project.jpeg', '/design/hero.jpeg'],
    configs: [
      { bhk: 3, price: '1.58 Cr', size: '1,650 sq ft' },
      { bhk: 4, price: '2.30 Cr', size: '2,400 sq ft' }
    ]
  },
  {
    id: 5,
    slug: 'sattva',
    name: 'Sattva Greenwood',
    city: 'Hyderabad',
    location: 'Kokapet',
    builder: 'Sattva Group',
    possession: 'Ready to move',
    status: 'Ready to move',
    bhk: '3–4',
    acres: '11',
    homes: '890',
    floors: '32',
    towers: '5',
    price: '₹1.52 – 2.65 Cr',
    rate: '₹10,800 / sq ft',
    gallery: ['/design/buyer-3.jpeg', '/design/garden.jpeg', '/design/clubhouse.jpeg'],
    configs: [
      { bhk: 3, price: '1.52 Cr', size: '1,720 sq ft' },
      { bhk: 4, price: '2.65 Cr', size: '2,650 sq ft' }
    ]
  },
  {
    id: 6,
    slug: 'lakeview',
    name: 'Lakeview Residences',
    city: 'Hyderabad',
    location: 'Narsingi',
    builder: 'Lakeview Homes',
    possession: 'Possession Dec 2027',
    status: 'Under construction',
    bhk: '2–3',
    acres: '5.4',
    homes: '410',
    floors: '20',
    towers: '3',
    price: '₹98 L – 1.45 Cr',
    rate: '₹8,300 / sq ft',
    gallery: ['/design/buyer-4.jpeg', '/design/entrance.jpeg', '/design/hero.jpeg'],
    configs: [
      { bhk: 2, price: '98 L', size: '1,180 sq ft' },
      { bhk: 3, price: '1.45 Cr', size: '1,590 sq ft' }
    ]
  },
  {
    id: 2,
    slug: 'solace',
    name: 'Solace Residences',
    city: 'Hyderabad',
    location: 'Gopanapally',
    builder: 'Solace Realty',
    possession: 'Possession Jun 2029',
    status: 'Under construction',
    bhk: '2–3',
    acres: '5.4',
    homes: '390',
    floors: '18',
    towers: '3',
    price: '₹98 L – 1.45 Cr',
    rate: '₹8,300 / sq ft',
    gallery: ['/design/project.jpeg', '/design/buyer-1.jpeg', '/design/garden.jpeg'],
    configs: [
      { bhk: 2, price: '98 L', size: '1,150 sq ft' },
      { bhk: 3, price: '1.45 Cr', size: '1,550 sq ft' }
    ]
  },
  {
    id: 3,
    slug: 'aparna',
    name: 'Aparna Sowparnika Rhythm of Rain',
    city: 'Hyderabad',
    location: 'Gopanapally',
    builder: 'Aparna Constructions',
    possession: 'Possession Dec 2028',
    status: 'Under construction',
    bhk: '2-4',
    acres: '16.5',
    homes: '1,200',
    floors: '26',
    towers: '6',
    price: '₹1.65 Cr - ₹3.67 Cr',
    rate: '₹12,500 / sq ft',
    gallery: ['/design/buyer-3.jpeg', '/design/clubhouse.jpeg', '/design/hero.jpeg'],
    configs: [
      { bhk: 2, price: '1.65 Cr', size: '1,320 sq ft' },
      { bhk: 3, price: '2.45 Cr', size: '1,960 sq ft' },
      { bhk: 4, price: '3.67 Cr', size: '2,950 sq ft' }
    ]
  },
  {
    id: 7,
    slug: 'urbania',
    name: 'Urbania Meadows',
    city: 'Hyderabad',
    location: 'Tellapur',
    builder: 'Urbania Homes',
    possession: 'Possession Dec 2029',
    status: 'Under construction',
    bhk: '2-3',
    acres: '8.2',
    homes: '620',
    floors: '22',
    towers: '4',
    price: '₹1.05 Cr - ₹1.85 Cr',
    rate: '₹8,200 / sq ft',
    gallery: ['/design/entrance.jpeg', '/design/buyer-2.jpeg', '/design/garden.jpeg'],
    configs: [
      { bhk: 2, price: '1.05 Cr', size: '1,240 sq ft' },
      { bhk: 3, price: '1.85 Cr', size: '1,820 sq ft' }
    ]
  }
];

export const DirectoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [localityFilter, setLocalityFilter] = useState(searchParams.get('locality') || 'All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'under_construction'>('all');
  const [bhkFilter, setBhkFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc' | 'possession'>('relevance');
  const [savedIds, setSavedIds] = useState<number[]>([1]);
  const [activePhotoIdx, setActivePhotoIdx] = useState<Record<number, number>>({});

  const toggleSave = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handlePhotoDot = (projectId: number, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIdx(prev => ({ ...prev, [projectId]: index }));
  };

  const filteredProjects = useMemo(() => {
    return PROJECTS_DATA.filter(project => {
      if (search) {
        const q = search.toLowerCase();
        const matches =
          project.name.toLowerCase().includes(q) ||
          project.location.toLowerCase().includes(q) ||
          project.builder.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (localityFilter !== 'All' && project.location.toLowerCase() !== localityFilter.toLowerCase()) {
        return false;
      }
      if (statusFilter === 'ready' && project.status !== 'Ready to move') {
        return false;
      }
      if (statusFilter === 'under_construction' && project.status !== 'Under construction') {
        return false;
      }
      if (bhkFilter !== 'all') {
        const hasBhk = project.configs.some(c => c.bhk === bhkFilter);
        if (!hasBhk) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') {
        const pA = a.id === 1 ? 1.12 : a.id === 4 ? 1.58 : a.id === 5 ? 1.52 : 0.98;
        const pB = b.id === 1 ? 1.12 : b.id === 4 ? 1.58 : b.id === 5 ? 1.52 : 0.98;
        return pA - pB;
      }
      if (sortBy === 'price-desc') {
        const pA = a.id === 1 ? 1.62 : a.id === 4 ? 2.30 : a.id === 5 ? 2.65 : 1.45;
        const pB = b.id === 1 ? 1.62 : b.id === 4 ? 2.30 : b.id === 5 ? 2.65 : 1.45;
        return pB - pA;
      }
      return 0;
    });
  }, [search, localityFilter, statusFilter, bhkFilter, sortBy]);

  return (
    <main className="project-listing">
      <h1>New projects in Hyderabad</h1>

      {/* Filter Bar matching client portal */}
      <div className="listing-filter-bar" aria-label="Project filters">
        <button
          type="button"
          className={localityFilter !== 'All' ? 'active' : ''}
          onClick={() => {
            const locs = ['All', 'Gopanapally', 'Kokapet', 'Tellapur', 'Puppalaguda', 'Narsingi'];
            const currentIdx = locs.indexOf(localityFilter);
            const nextLoc = locs[(currentIdx + 1) % locs.length];
            setLocalityFilter(nextLoc);
          }}
        >
          <span>{localityFilter === 'All' ? 'Locality' : localityFilter}</span>
          <ChevronDown size={14} />
        </button>

        <button
          type="button"
          className={bhkFilter !== 'all' ? 'active' : ''}
          onClick={() => {
            const bhks: (number | 'all')[] = ['all', 2, 3, 4];
            const currentIdx = bhks.indexOf(bhkFilter);
            const nextBhk = bhks[(currentIdx + 1) % bhks.length];
            setBhkFilter(nextBhk);
          }}
        >
          <span>{bhkFilter === 'all' ? 'Configuration' : `${bhkFilter} BHK`}</span>
          <ChevronDown size={14} />
        </button>

        <div className="listing-status-filters">
          <button
            type="button"
            className={statusFilter === 'ready' ? 'active' : ''}
            aria-pressed={statusFilter === 'ready'}
            onClick={() => setStatusFilter(prev => prev === 'ready' ? 'all' : 'ready')}
          >
            Ready to move
          </button>
          <button
            type="button"
            className={statusFilter === 'under_construction' ? 'active' : ''}
            aria-pressed={statusFilter === 'under_construction'}
            onClick={() => setStatusFilter(prev => prev === 'under_construction' ? 'all' : 'under_construction')}
          >
            Under construction
          </button>
        </div>

        <button
          type="button"
          className="listing-all-filters"
          onClick={() => {
            setLocalityFilter('All');
            setStatusFilter('all');
            setBhkFilter('all');
            setSearch('');
          }}
        >
          <SlidersHorizontal size={16} />
          Reset filters
        </button>
      </div>

      {/* Results Toolbar */}
      <div className="listing-results-toolbar">
        <div className="listing-results-summary">
          <p role="status">
            Showing {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
          </p>
          {localityFilter !== 'All' && (
            <button
              className="listing-applied-filter"
              onClick={() => setLocalityFilter('All')}
            >
              {localityFilter} ✕
            </button>
          )}
          {statusFilter !== 'all' && (
            <button
              className="listing-applied-filter"
              onClick={() => setStatusFilter('all')}
            >
              {statusFilter === 'ready' ? 'Ready to move' : 'Under construction'} ✕
            </button>
          )}
          {bhkFilter !== 'all' && (
            <button
              className="listing-applied-filter"
              onClick={() => setBhkFilter('all')}
            >
              {bhkFilter} BHK ✕
            </button>
          )}
        </div>

        <div className="listing-sort">
          <select
            className="bg-transparent text-xs font-semibold text-[#111111] border border-[#e6e6e6] rounded-md px-3 py-1.5 cursor-pointer focus:outline-none"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="price-asc">Sort: Price low to high</option>
            <option value="price-desc">Sort: Price high to low</option>
            <option value="possession">Sort: Possession date</option>
          </select>
        </div>
      </div>

      {/* Results Project Cards List */}
      <div className="listing-results">
        {filteredProjects.map((project) => {
          const currentImgIdx = activePhotoIdx[project.id] || 0;
          const currentImg = project.gallery[currentImgIdx] || project.gallery[0];
          const isSaved = savedIds.includes(project.id);

          return (
            <article
              key={project.id}
              className="listing-card cursor-pointer hover:border-[#10261a]/60 transition-colors"
              onClick={() => navigate(`/properties/${project.id}`)}
            >
              {/* Card Left: Gallery with Photo Dots */}
              <div className="listing-card-gallery">
                <Link
                  to={`/properties/${project.id}`}
                  aria-label={`View ${project.name}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={currentImg}
                    alt={`${project.name}, project view`}
                    loading="lazy"
                  />
                </Link>
                <div className="listing-photo-dots" aria-label={`${project.name} photos`}>
                  {project.gallery.map((img, dotIdx) => (
                    <button
                      key={img}
                      type="button"
                      className={currentImgIdx === dotIdx ? 'active' : ''}
                      onClick={(e) => handlePhotoDot(project.id, dotIdx, e)}
                      aria-label={`Show photo ${dotIdx + 1}`}
                      aria-pressed={currentImgIdx === dotIdx}
                    />
                  ))}
                </div>
              </div>

              {/* Card Right: Content */}
              <div className="listing-card-content">
                <div className="listing-card-title">
                  <div>
                    <p className="listing-locality">
                      <MapPin size={15} />
                      {project.location}, {project.city}
                    </p>
                    <h2>
                      <Link to={`/properties/${project.id}`}>
                        {project.name}
                      </Link>
                    </h2>
                    <p className="listing-builder">
                      <span>{project.builder[0]}</span>
                      {project.builder}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="p-2 text-[#767676] hover:text-[#10261a] transition-colors"
                    onClick={(e) => toggleSave(project.id, e)}
                    aria-label={isSaved ? 'Remove from Saved' : 'Save project'}
                  >
                    <Bookmark
                      size={20}
                      fill={isSaved ? '#10261a' : 'none'}
                      color={isSaved ? '#10261a' : 'currentColor'}
                    />
                  </button>
                </div>

                <div className="listing-card-price">
                  <small>Price range</small>
                  <strong>{project.price}</strong>
                  <small>{project.rate}</small>
                </div>

                <dl className="listing-facts">
                  <div>
                    <dt>
                      <Calendar size={14} /> Possession
                    </dt>
                    <dd>{project.possession.replace('Possession ', '')}</dd>
                  </div>
                  <div>
                    <dt>
                      <Layers size={14} /> Acres
                    </dt>
                    <dd>{project.acres}</dd>
                  </div>
                  <div>
                    <dt>
                      <Home size={14} /> Homes
                    </dt>
                    <dd>{project.homes}</dd>
                  </div>
                  <div>
                    <dt>
                      <Building2 size={14} /> Floors
                    </dt>
                    <dd>{project.floors}</dd>
                  </div>
                  <div>
                    <dt>
                      <Building2 size={14} /> Towers
                    </dt>
                    <dd>{project.towers}</dd>
                  </div>
                </dl>

                <div className="listing-configs">
                  <p>{project.configs.length} configurations</p>
                  <div>
                    {project.configs.map((c) => (
                      <Link
                        key={c.bhk}
                        to={`/properties/${project.id}#units`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>
                          <Home size={14} />
                          {c.bhk} BHK
                        </span>
                        <p>
                          <small>from</small> <strong>₹{c.price}</strong>
                        </p>
                        <small>{c.size}</small>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
};
