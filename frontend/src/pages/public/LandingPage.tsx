import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Columns,
  Route,
  Sparkles,
  ShieldCheck,
  Building2,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

interface FeaturedProject {
  id: string | number;
  propId: number;
  name: string;
  location: string;
  city: string;
  builder: string;
  status: string;
  priceMin: string;
  image: string;
}

const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    id: 'ramky',
    propId: 1,
    name: 'Ramky Kingston Park Orbit',
    location: 'Gopanapally',
    city: 'Hyderabad',
    builder: 'Ramky Estates',
    status: 'Under construction',
    priceMin: '₹1.12 Cr',
    image: '/design/buyer-1.jpeg'
  },
  {
    id: 'aurelia',
    propId: 2,
    name: 'Aurelia Heights',
    location: 'Puppalaguda',
    city: 'Hyderabad',
    builder: 'Aurelia Developers',
    status: 'Under construction',
    priceMin: '₹1.58 Cr',
    image: '/design/buyer-2.jpeg'
  },
  {
    id: 'sattva',
    propId: 3,
    name: 'Sattva Greenwood',
    location: 'Kokapet',
    city: 'Hyderabad',
    builder: 'Sattva Group',
    status: 'Ready to move',
    priceMin: '₹1.52 Cr',
    image: '/design/buyer-3.jpeg'
  }
];

export const LandingPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/directory?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/directory');
    }
  };

  const handleLocalityClick = (locality: string) => {
    navigate(`/directory?locality=${encodeURIComponent(locality)}`);
  };

  return (
    <div className="portal-home">
      {/* Hero Section matching client portal */}
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <p className="home-eyebrow">
            <MapPin size={15} /> Find your place in Hyderabad
          </p>
          <h1 id="home-title">
            A home that fits.
            <br />
            <span>A life that flows.</span>
          </h1>
          <p className="home-hero-description">
            Find a neighbourhood you love, a commute that works, and a home that feels like yours.
          </p>

          {/* Search form matching client styling */}
          <form className="home-search" role="search" onSubmit={handleSearch}>
            <label htmlFor="home-project-search">Where would you like to live?</label>
            <div>
              <Search size={21} className="text-[#5c5c5c]" />
              <input
                id="home-project-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="City, locality, project or builder"
              />
              <button type="submit" aria-label="Find homes">
                <span>Find homes</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </form>

          {/* Quick Locality Chips */}
          <div className="home-popular">
            <span>Explore</span>
            {['Gopanapally', 'Kokapet', 'Tellapur'].map((locality) => (
              <button
                key={locality}
                type="button"
                onClick={() => handleLocalityClick(locality)}
                className="inline-flex items-center gap-1 cursor-pointer hover:underline"
              >
                {locality}
                <ArrowUpRight size={13} />
              </button>
            ))}
          </div>

          <Link to="/directory" className="home-browse-link">
            Browse all 7 projects <ArrowRight size={17} />
          </Link>
        </div>

        {/* Hero Visual on Right with Floating Spotlight Card */}
        <div className="home-hero-visual">
          <img
            src="/design/hero.jpeg"
            alt="Landscaped courtyard with contemporary apartments and space to unwind"
            fetchPriority="high"
          />
          <span className="home-image-label">A little closer to your everyday.</span>
          <Link to="/properties/1" className="home-spotlight">
            <div>
              <small>Spaces to come home to</small>
              <strong>Ramky Kingston Park Orbit</strong>
              <span>Gopanapally, Hyderabad</span>
            </div>
            <span className="home-spotlight-arrow">
              <ArrowUpRight size={23} />
            </span>
          </Link>
        </div>
      </section>

      {/* Featured Projects Section matching client portal */}
      <section className="home-featured" aria-labelledby="home-featured-title">
        <div className="home-section-heading">
          <div>
            <p className="home-eyebrow">Your next chapter</p>
            <h2 id="home-featured-title">Start with a few favourites.</h2>
            <p>Explore homes across Hyderabad, with the details in one place.</p>
          </div>
          <Link to="/directory" className="inline-flex items-center gap-1.5 font-medium hover:underline text-sm">
            View all projects <ArrowRight size={18} />
          </Link>
        </div>

        <div className="home-project-grid">
          {FEATURED_PROJECTS.map((project) => (
            <Link
              key={project.id}
              to={`/properties/${project.propId}`}
              className="home-project group"
            >
              <div className="home-project-image">
                <img src={project.image} alt={project.name} loading="lazy" />
                <span>{project.status}</span>
              </div>
              <div className="home-project-copy">
                <p>
                  <MapPin size={14} className="inline mr-1 text-[#5c5c5c]" />
                  {project.location}, {project.city}
                </p>
                <h3 className="group-hover:text-[#1e6b3a] transition-colors">{project.name}</h3>
                <small>by {project.builder}</small>
                <div>
                  <strong>{project.priceMin} onwards</strong>
                  <ArrowUpRight size={20} className="text-[#5c5c5c] group-hover:text-[#1e6b3a] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Editorial Value Proposition / Tools Section */}
      <section className="home-tools" aria-label="Tools for your home search">
        <div>
          <p className="home-eyebrow">Make room for what matters</p>
          <h2>A clearer way to find home.</h2>
        </div>

        {[
          {
            icon: Bookmark,
            title: 'Keep your favourites',
            desc: 'Save the projects and unit plans you want to come back to.',
            link: '/dashboard'
          },
          {
            icon: Columns,
            title: 'See the whole picture',
            desc: 'Compare prices, spaces and neighbourhoods side by side.',
            link: '/dashboard?tab=comparison'
          },
          {
            icon: Route,
            title: 'Picture your everyday',
            desc: 'Keep work, school and your favourite places in the picture.',
            link: '/dashboard?tab=commute'
          }
        ].map(({ icon: Icon, title, desc, link }) => (
          <Link key={title} to={link} className="hover:border-[#10261a] transition-colors">
            <Icon size={23} className="text-[#10261a]" />
            <h3>{title}</h3>
            <p>{desc}</p>
            <span>
              Explore <ArrowRight size={16} />
            </span>
          </Link>
        ))}
      </section>

      {/* Real-time AI Intelligence Engine Showcase Banner */}
      <section className="mt-16 p-8 rounded-2xl bg-[#f7f7f7] border border-[#e6e6e6] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-[#10261a] text-[#8bcaa0] flex items-center justify-center">
              <Sparkles size={14} />
            </span>
            <span className="text-xs font-semibold tracking-wide uppercase text-[#1e6b3a] font-mono">
              Property Intelligence Engine Active
            </span>
          </div>
          <h3 className="text-xl font-heading font-semibold text-[#111111]">
            Deterministic due-diligence, spatial intelligence & verified numbers.
          </h3>
          <p className="text-xs text-[#5c5c5c] leading-relaxed">
            Unlike static portals with placeholder buttons, HiiN actively computes incremental carpet costs (₹12,500/sqft), room connectivity ratios, cross-ventilation azimuths, and live CPCB atmospheric telemetry across all 9 property modules.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            to="/properties/1"
            className="w-full md:w-auto px-5 py-2.5 rounded-lg bg-[#10261a] text-white font-medium text-xs hover:bg-[#1e6b3a] transition-colors flex items-center justify-center gap-2"
          >
            <span>Test Ramky Kingston Engine</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
};
