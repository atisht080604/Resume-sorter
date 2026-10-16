import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  FileSpreadsheet,
  FileText,
  ArrowRight,
  Calendar,
  Briefcase,
  Search,
  AlertCircle
} from 'lucide-react';
import apiService from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

export default function ScreeningHistory() {
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  const fetchScreenings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getScreenings();
      setScreenings(res.screenings || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch screening sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreenings();
  }, []);

  const filtered = screenings.filter((s) => {
    const q = search.toLowerCase();
    const titleMatch = (s.job_title || '').toLowerCase().includes(q);
    const uidMatch = (s.session_uid || '').toLowerCase().includes(q);
    const deptMatch = (s.department || '').toLowerCase().includes(q);
    return titleMatch || uidMatch || deptMatch;
  });

  if (loading) {
    return <LoadingSkeleton type="table" count={5} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Screening History</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit logs and persistent records of all previous resume screening sessions
          </p>
        </div>
        <Link
          to="/screenings/new"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-xs transition-colors"
        >
          <span>Start New Screening</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={fetchScreenings} className="font-semibold underline">Retry</button>
        </div>
      )}

      {/* Search */}
      <div className="card-surface p-3 flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search by session UID, job title, or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs text-slate-800 bg-transparent border-none focus:outline-none placeholder:text-slate-400"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-slate-400 hover:text-slate-600 px-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Screenings Table */}
      {screenings.length === 0 ? (
        <EmptyState
          icon={History}
          title="No screening sessions recorded"
          description="Screened candidate batches will be permanently recorded here with exportable reports."
          actionText="Screen First Batch"
          actionLink="/screenings/new"
        />
      ) : filtered.length === 0 ? (
        <div className="card-surface p-8 text-center text-xs text-slate-500">
          No screening sessions matched "{search}".
        </div>
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Session ID</th>
                  <th className="py-3 px-4">Target Job</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Date Screened</th>
                  <th className="py-3 px-4">Candidates</th>
                  <th className="py-3 px-4">Avg Score</th>
                  <th className="py-3 px-4">Distribution</th>
                  <th className="py-3 px-4 text-right">Reports & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      {s.session_uid}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {s.job_title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {s.department || 'Engineering'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {s.created_at ? s.created_at.replace('T', ' ').slice(0, 16) : '-'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {s.total_resumes} resumes
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {s.average_score}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {s.high_match_count} H
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {s.medium_match_count} M
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {s.low_match_count} L
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <a
                          href={apiService.getExportUrl(s.id, 'csv')}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-emerald-700 transition-colors"
                          title="Download CSV"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        </a>
                        <a
                          href={apiService.getExportUrl(s.id, 'pdf')}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-rose-700 transition-colors"
                          title="Download PDF"
                        >
                          <FileText className="w-4 h-4 text-rose-600" />
                        </a>
                        <Link
                          to={`/candidates?session_id=${s.id}`}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-brand-600 text-white font-semibold text-xs shadow-2xs transition-colors"
                        >
                          <span>Results</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
