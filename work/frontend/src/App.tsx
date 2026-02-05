import React, { useState } from 'react'
import axios from 'axios'
import JobList from './components/JobList'

export default function App() {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const search = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await axios.post('/api/search', { keywords: query, location })
      setJobs(res.data?.jobs || res.data || [])
    } catch (err: any) {
      setError(err?.message || 'Błąd')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 futuristic-bg">
      <div className="mx-auto max-w-4xl relative z-20">
        <div className="glass rounded-xl p-6 shadow-xl mb-6">
          <header className="mb-4">
            <h1 className="text-4xl font-extrabold neon-text">Work — Szukaj ofert</h1>
            <p className="text-gray-300 mt-1">Szybkie wyszukiwanie ofert (Jooble)</p>
          </header>

          <form onSubmit={search} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-0">
            <input
              className="p-3 rounded border border-transparent bg-white/5 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="np. frontend developer"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <input
              className="p-3 rounded border border-transparent bg-white/5 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="miasto / zdalnie"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <div>
              <button
                className="w-full h-full btn-neon rounded px-4 py-3"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Szukam...' : 'Szukaj'}
              </button>
            </div>
          </form>
        </div>

        {error && <div className="text-red-400 mb-4">{error}</div>}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="p-4 rounded-xl job-card glass animate-pulse-slow">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 w-3/4">
                    <div className="h-5 skeleton w-3/4" />
                    <div className="h-3 skeleton w-1/2" />
                  </div>
                  <div className="h-3 skeleton w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <JobList jobs={jobs} />
        )}
      </div>
    </div>
  )
}
