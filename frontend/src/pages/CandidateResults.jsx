import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  GitCompare,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  Eye,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import apiService from '../services/api';
import ScoreBadge from '../components/ScoreBadge';
import SkillBadge from '../components/SkillBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

export default function CandidateResults() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rank');
  const [sortOrder, setSortOrder] = useState('asc');

  // Multi-select for side-by-side comparison
  const [selectedResultIds, setSelectedResultIds] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (sessionId) {
        const sessionRes = await apiService.getScreening(sessionId);
        setSession(sessionRes.session || null);
        const candRes = await apiService.getScreeningCandidates(sessionId, {
          category: categoryFilter,
          search: searchQuery,
          sort_by: sortBy,
          order: sortOrder
        });
        setResults(candRes.results || []);
      } else {
        // If no session_id is provided, load latest screening session or list
        const screeningsRes = await apiService.getScreenings();
        const allSessions = screeningsRes.screenings || [];
        if (allSessions.length > 0) {
          const latestId = allSessions[0].id;
          const sessionRes = await apiService.getScreening(latestId);
          setSession(sessionRes.session || null);
          const candRes = await apiService.getScreeningCandidates(latestId);
          setResults(candRes.results || []);
        } else {
          setResults([]);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load candidate results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sessionId, categoryFilter, sortBy, sortOrder]);

  const toggleSelectCandidate = (id) => {
    if (selectedResultIds.includes(id)) {
      setSelectedResultIds(selectedResultIds.filter((item) => item !== id));
    } else {
      if (selectedResultIds.length >= 4) {
        alert('You can select a maximum of 4 candidates for side-by-side comparison.');
        return;
      }
      setSelectedResultIds([...selectedResultIds, id]);
    }
  };

  const handleCompareClick = () => {
    if (selectedResultIds.length < 2) {
      alert('Please select at least 2 candidates to compare.');
      return;
    }
    navigate(`/compare?result_ids=${selectedResultIds.join(',')}`);
  };

  // Filter in memory for instantaneous search query
  const displayResults = results.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = (r.candidate_name || '').toLowerCase().includes(q);
    const uidMatch = (r.candidate_uid || '').toLowerCase().includes(q);
    const fileMatch = (r.filename || '').toLowerCase().includes(q);
    return nameMatch || uidMatch || fileMatch;
  });

  // Pagination calculation
  const totalPages = Math.ceil(displayResults.length / pageSize) || 1;
  const paginatedResults = displayResults.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) {
    return <LoadingSkeleton type="table" count={6} />;
  }

  return (
    <div className="space-y-6">
      {/* Session Title & Export Header */}
      <div className="card-surface p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              Screening Session {session?.session_uid || ''}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              {displayResults.length} candidates ranked
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            {session ? session.job_title : 'Candidate Screening Results'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked descending by composite score (0.40 Semantic + 0.25 Req + 0.15 Pref + 0.10 Exp + 0.05 Edu + 0.05 Cert)
          </p>
        </div>

        {/* Download CSV & PDF Action Buttons */}
        {session && (
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            {selectedResultIds.length >= 2 && (
              <button
                onClick={handleCompareClick}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Compare Selected ({selectedResultIds.length})</span>
              </button>
            )}

            <a
              href={apiService.getExportUrl(session.id, 'csv')}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </a>

            <a
              href={apiService.getExportUrl(session.id, 'pdf')}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>Export PDF Report</span>
            </a>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card-surface p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Search */}
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search candidate UID, name, filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>

        {/* Filters and Sorting */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-end flex-wrap gap-y-2">
          {/* Match Category Filter */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-slate-300 focus:outline-none bg-white font-medium"
            >
              <option value="all">All Categories</option>
              <option value="High Match">High Match (≥75%)</option>
              <option value="Medium Match">Medium Match (50-74%)</option>
              <option value="Low Match">Low Match (&lt;50%)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-600">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-slate-300 focus:outline-none bg-white font-medium"
            >
              <option value="rank">Ranking (Highest)</option>
              <option value="composite_score">Final Score</option>
              <option value="semantic_similarity">Semantic (S-BERT)</option>
              <option value="required_skills">Required Skills</option>
              <option value="experience">Experience Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidate Results Table */}
      {displayResults.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No candidates found"
          description="Upload resumes for this job to generate ranked candidate evaluations."
          actionText="Upload Resumes"
          actionLink={`/screenings/new${session ? `?job_id=${session.job_id}` : ''}`}
        />
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-8 text-center">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="py-3 px-3 text-center">Rank</th>
                  <th className="py-3 px-4">Candidate & Filename</th>
                  <th className="py-3 px-4">Composite Score</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Semantic (40%)</th>
                  <th className="py-3 px-4">Req Skills (25%)</th>
                  <th className="py-3 px-4">Exp (10%)</th>
                  <th className="py-3 px-4">Matched Skills</th>
                  <th className="py-3 px-4">Missing Req Skills</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedResults.map((r) => {
                  const isChecked = selectedResultIds.includes(r.id);
                  const scores = r.scores || {};
                  const skills = r.skills_breakdown || {};
                  const matchedReq = skills.matched_required || [];
                  const missingReq = skills.missing_required || [];

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/80 transition-colors ${isChecked ? 'bg-brand-50/30' : ''}`}
                    >
                      {/* Checkbox for compare */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectCandidate(r.id)}
                          className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5 cursor-pointer"
                          title="Select to compare"
                        />
                      </td>

                      {/* Rank */}
                      <td className="py-3 px-3 text-center font-bold text-slate-900">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                          r.rank === 1 ? 'bg-amber-100 text-amber-800 font-extrabold' :
                          r.rank === 2 ? 'bg-slate-200 text-slate-800 font-bold' :
                          r.rank === 3 ? 'bg-amber-50 text-amber-900 font-bold' :
                          'text-slate-500'
                        }`}>
                          {r.rank || '-'}
                        </span>
                      </td>

                      {/* Candidate info */}
                      <td className="py-3 px-4">
                        <Link
                          to={`/candidates/${r.candidate_id}?session_id=${r.session_id}`}
                          className="font-bold text-slate-900 hover:text-brand-600 transition-colors block truncate max-w-[180px]"
                        >
                          {r.candidate_name || 'Candidate'}
                        </Link>
                        <p className="text-[11px] font-mono text-slate-400 truncate max-w-[180px]">
                          {r.candidate_uid} • {r.filename}
                        </p>
                      </td>

                      {/* Composite Score */}
                      <td className="py-3 px-4">
                        <span className="text-base font-extrabold text-slate-900">
                          {r.composite_score}%
                        </span>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-4">
                        <ScoreBadge score={r.composite_score} category={r.match_category} showScore={false} size="sm" />
                      </td>

                      {/* Semantic Score */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {scores.semantic_similarity}%
                        </div>
                        <div className="w-16 bg-slate-200 rounded-full h-1 mt-1">
                          <div
                            className="bg-brand-600 h-1 rounded-full"
                            style={{ width: `${Math.min(100, scores.semantic_similarity || 0)}%` }}
                          />
                        </div>
                      </td>

                      {/* Required Skills Score */}
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {scores.required_skills}%
                      </td>

                      {/* Experience Score */}
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {scores.experience}%
                      </td>

                      {/* Matched Skills Preview */}
                      <td className="py-3 px-4 max-w-[160px]">
                        <div className="flex flex-wrap gap-1">
                          {matchedReq.slice(0, 3).map((s, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-200">
                              {s}
                            </span>
                          ))}
                          {matchedReq.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              +{matchedReq.length - 3}
                            </span>
                          )}
                          {matchedReq.length === 0 && (
                            <span className="text-[10px] text-slate-400 italic">None</span>
                          )}
                        </div>
                      </td>

                      {/* Missing Skills Preview */}
                      <td className="py-3 px-4 max-w-[160px]">
                        <div className="flex flex-wrap gap-1">
                          {missingReq.slice(0, 3).map((s, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-medium border border-rose-200">
                              {s}
                            </span>
                          ))}
                          {missingReq.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              +{missingReq.length - 3}
                            </span>
                          )}
                          {missingReq.length === 0 && (
                            <span className="text-[10px] text-emerald-600 font-medium">All matched</span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/candidates/${r.candidate_id}?session_id=${r.session_id}`}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                        >
                          <span>Analyze</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span>
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, displayResults.length)} of {displayResults.length} candidates
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded border border-slate-300 disabled:opacity-40"
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-7 h-7 rounded border font-semibold ${
                      currentPage === idx + 1
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded border border-slate-300 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
