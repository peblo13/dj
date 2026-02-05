import React from 'react'

export default function JobList({ jobs }: { jobs: any[] }) {
  if (!jobs || jobs.length === 0) return <div className="text-gray-400">Brak wyników</div>

  return (
    <div className="space-y-4">
      {jobs.map((job, idx) => (
        <a
          key={idx}
          href={job?.link || '#'}
          target="_blank"
          rel="noreferrer"
          className="block p-4 rounded-xl job-card glass hover:shadow-xl transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-white">{job?.title || job?.position}</h3>
              <p className="text-sm text-gray-300">{job?.company || job?.employer}</p>
            </div>
            <div className="text-sm text-gray-400">{job?.location || job?.city}</div>
          </div>

          {job?.snippet && <p className="mt-2 text-sm text-gray-300">{job.snippet}</p>}
        </a>
      ))}
    </div>
  )
}
