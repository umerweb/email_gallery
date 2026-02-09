import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // React Router

const BACKEND_URL =  import.meta.env.VITE_BACKEND_URL;
console.log(BACKEND_URL)
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
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white shadow-md px-8 py-5 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-800">Email Templates</h1>
        <input
          type="text"
          placeholder="Search templates..."
          className="w-96 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
        />
      </div>

      <div className="flex">

        {/* Sidebar */}
        <aside className="w-64 bg-white border-r min-h-screen p-6 space-y-6 shadow-sm">
          <h2 className="font-semibold text-lg text-gray-700">Filters</h2>

          <div>
            <label className="text-sm text-gray-500">Brand</label>
            <select
              className="w-full border rounded p-2 mt-1 hover:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
              value={filters.brand}
              onChange={(e) => updateFilter('brand', e.target.value)}
            >
              <option value="">All</option>
              {options.brands.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-500">Language</label>
            <select
              className="w-full border rounded p-2 mt-1 hover:border-green-400 focus:ring-1 focus:ring-green-500"
              value={filters.language}
              onChange={(e) => updateFilter('language', e.target.value)}
            >
              <option value="">All</option>
              {options.languages.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-500">Country</label>
            <select
              className="w-full border rounded p-2 mt-1 hover:border-amber-400 focus:ring-1 focus:ring-amber-500"
              value={filters.country}
              onChange={(e) => updateFilter('country', e.target.value)}
            >
              <option value="">All</option>
              {options.countries.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </aside>

        {/* Templates Grid */}
        <main className="flex-1 p-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {templates.map(t => (
              <div
                key={t.id}
                onClick={() => openTemplate(t.id)}
                className="cursor-pointer bg-white rounded-xl border border-gray-200 shadow hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
              >
                <div className="h-32 rounded-t-xl flex items-center justify-center text-white text-2xl font-bold bg-gradient-to-br from-indigo-500 to-indigo-700 relative">
                  {t.brand?.[0]?.toUpperCase() || 'T'}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-t-xl" />
                </div>

                <div className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2 text-gray-800">{t.subject}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-3">{t.snippet}</p>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {t.brand && <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">{t.brand}</span>}
                    {t.language && <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">{t.language}</span>}
                    {t.country && <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{t.country}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10 flex-wrap items-center">
              <button
                onClick={() => page > 1 && loadTemplates(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 bg-white border rounded hover:bg-gray-200 disabled:opacity-40"
              >
                Prev
              </button>

              {getPageNumbers().map(p => (
                <button
                  key={p}
                  onClick={() => loadTemplates(p)}
                  className={`px-4 py-2 border rounded ${
                    p === page ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => page < totalPages && loadTemplates(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white border rounded hover:bg-gray-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
