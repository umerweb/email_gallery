import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
console.log(BACKEND_URL);

export default function TemplatesPage() {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({
    brand: '',
    language: '',
    country: '',
    search: ''
  });

  const [options, setOptions] = useState({
    brands: [],
    languages: [],
    countries: [],
  });

  const loadTemplates = async (p = 1, f = filters) => {
    const res = await axios.get(`${BACKEND_URL}/templates`, {
      params: {
        page: p,
        brand: f.brand,
        language: f.language,
        country: f.country,
        search: f.search
      }
    });

    setTemplates(res.data.templates);
    setPage(p);
    setTotalPages(res.data.totalPages || 1);
  };

  useEffect(() => {
    axios.get(`${BACKEND_URL}/templates/filters`).then(res => setOptions(res.data));
    loadTemplates();
  }, []);

  const updateFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    loadTemplates(1, newFilters);
  };

  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const left = Math.max(1, page - delta);
    const right = Math.min(totalPages, page + delta);
    for (let i = left; i <= right; i++) pages.push(i);
    return pages;
  };

  const openTemplate = (id) => {
    navigate(`/email/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-8 py-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Email Templates
            </h1>
            <p className="text-sm text-gray-500 mt-1">Browse and customize your email collection</p>
          </div>
          
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search templates..."
              className="w-96 pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex max-w-[1800px] mx-auto">

        {/* Sidebar */}
        <aside className="w-72 bg-white/60 backdrop-blur-sm border-r border-gray-200/50 min-h-screen p-6 space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h2 className="font-semibold text-lg text-gray-800">Filters</h2>
          </div>

          <div className="space-y-4">
            <div className="group">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 block">Brand</label>
              <div className="relative">
                <select
                  className="w-full border border-gray-200 rounded-lg p-3 pr-10 appearance-none bg-white hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  value={filters.brand}
                  onChange={(e) => updateFilter('brand', e.target.value)}
                >
                  <option value="">All Brands</option>
                  {options.brands.map(b => <option key={b}>{b}</option>)}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="group">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 block">Language</label>
              <div className="relative">
                <select
                  className="w-full border border-gray-200 rounded-lg p-3 pr-10 appearance-none bg-white hover:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                  value={filters.language}
                  onChange={(e) => updateFilter('language', e.target.value)}
                >
                  <option value="">All Languages</option>
                  {options.languages.map(l => <option key={l}>{l}</option>)}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="group">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 block">Country</label>
              <div className="relative">
                <select
                  className="w-full border border-gray-200 rounded-lg p-3 pr-10 appearance-none bg-white hover:border-amber-300 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                  value={filters.country}
                  onChange={(e) => updateFilter('country', e.target.value)}
                >
                  <option value="">All Countries</option>
                  {options.countries.map(c => <option key={c}>{c}</option>)}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Active Filters Count */}
          {(filters.brand || filters.language || filters.country) && (
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setFilters({ brand: '', language: '', country: '', search: filters.search });
                  loadTemplates(1, { brand: '', language: '', country: '', search: filters.search });
                }}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            </div>
          )}
        </aside>

        {/* Templates Grid */}
        <main className="flex-1 p-8">
          {templates.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-96 text-gray-400">
  <svg
    className="w-20 h-20 mb-4 animate-spin text-indigo-500"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    ></path>
  </svg>
  <p className="text-lg font-medium">Templates Loading...</p>
</div>
          ) : (
              <div className="flex flex-wrap gap-6 justify-between">
  {templates.map((t) => {
    const brandInitial = t.brand ? t.brand.charAt(0).toUpperCase() : '?';
    return (
      <div
        key={`${t.id}`}  
        onClick={() => openTemplate(t.id)}
        className="group cursor-pointer bg-white rounded-lg border border-gray-200/60 shadow-sm hover:shadow-xl hover:border-indigo-200 transform hover:-translate-y-2 transition-all duration-300 overflow-hidden w-[270px]"
      >
        {/* Brand header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200 bg-gray-50">
          {t.brand_image ? (
            <img
              src={t.brand_image}
              alt={t.brand}
              className="w-10 h-10 rounded-full object-cover border border-gray-300"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-semibold text-lg">
              {brandInitial}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-medium text-gray-800">{t.brand || 'Unknown Brand'}</span>
            <span className="text-xs text-gray-500">
              {t.country || 'Unknown'} • {new Date(t.sent_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Thumbnail */}
        <div className="relative w-[270px] h-[333px] overflow-hidden">
          <img
            src={`data:image/png;base64,${t.thumbnail_path}`}
            alt={t.subject}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Subject & snippet */}
        <div className="p-4 w-[100%]">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {t.subject}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
            {t.snippet}
          </p>
        </div>
      </div>
    );
  })}
</div>


          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-12 flex-wrap items-center">
              <button
                onClick={() => page > 1 && loadTemplates(page - 1)}
                disabled={page === 1}
                className="px-5 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-gray-700 shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </span>
              </button>

              {getPageNumbers().map(p => (
                <button
                  key={p}
                  onClick={() => loadTemplates(p)}
                  className={`px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm ${
                    p === page 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-200 scale-110' 
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => page < totalPages && loadTemplates(page + 1)}
                disabled={page === totalPages}
                className="px-5 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-gray-700 shadow-sm"
              >
                <span className="flex items-center gap-2">
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}