import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  GitCompare,
  ArrowLeft,
  Award,
  CheckCircle2,
  XCircle,
  Briefcase,
  GraduationCap,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import apiService from '../services/api';
import ScoreBadge from '../components/ScoreBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

const CANDIDATE_COLORS = ['#0284C7', '#10B981', '#F59E0B', '#8B5CF6'];

export default function CandidateCompare() {
  const [searchParams] = useSearchParams();
  const resultIdsStr = searchParams.get('result_ids') || '';
  const candidateIdsStr = searchParams.get('candidate_ids') || '';

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!resultIdsStr && !candidateIdsStr) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const rIds = resultIdsStr ? resultIdsStr.split(',').map((i) => i.trim()) : [];
    const cIds = candidateIdsStr ? candidateIdsStr.split(',').map((i) => i.trim()) : [];

    apiService.compareCandidates(rIds, cIds)
      .then((res) => {
        setCandidates(res.candidates || []);
      })
      .catch((err) => setError(err.message || 'Failed to compare candidates.'))
      .finally(() => setLoading(false));
  }, [resultIdsStr, candidateIdsStr]);

  if (loading) {
    return <LoadingSkeleton type="detail" />;
  }

  if (candidates.length < 2) {
    return (
      <EmptyState
        icon={GitCompare}
        title="Side-by-Side Comparison"
        description="Select at least 2 candidates from the Candidate Results table to compare their skill coverage, experience, and score components."
        actionText="Back to Candidate Results"
        actionLink="/candidates"
      />
    );
  }

  // Prepare Comparative Chart Data
  const chartData = [
    {
      subject: 'Semantic Sim (40%)',
      ...candidates.reduce((acc, c, idx) => {
        acc[c.candidate_name || `Cand ${idx + 1}`] = c.scores?.semantic_similarity || 0;
        return acc;
      }, {})
    },
    {
      subject: 'Required Skills (25%)',
      ...candidates.reduce((acc, c, idx) => {
        acc[c.candidate_name || `Cand ${idx + 1}`] = c.scores?.required_skills || 0;
        return acc;
      }, {})
    },
    {
      subject: 'Preferred Skills (15%)',
      ...candidates.reduce((acc, c, idx) => {
        acc[c.candidate_name || `Cand ${idx + 1}`] = c.scores?.preferred_skills || 0;
        return acc;
      }, {})
    },
    {
      subject: 'Experience (10%)',
      ...candidates.reduce((acc, c, idx) => {
        acc[c.candidate_name || `Cand ${idx + 1}`] = c.scores?.experience || 0;
        return acc;
      }, {})
    },
    {
      subject: 'Education (5%)',
      ...candidates.reduce((acc, c, idx) => {
        acc[c.candidate_name || `Cand ${idx + 1}`] = c.scores?.education || 0;
        return acc;
      }, {})
    },
    {
      subject: 'Certification (5%)',
      ...candidates.reduce((acc, c, idx) => {
        acc[c.candidate_name || `Cand ${idx + 1}`] = c.scores?.certification || 0;
        return acc;
      }, {})
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Link
          to="/candidates"
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Side-by-Side Candidate Comparison
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluating {candidates.length} candidates across research criteria and skill matrices
          </p>
        </div>
      </div>

      {/* Visual Comparative Chart */}
      <div className="card-surface p-6">
        <h2 className="text-sm font-bold text-slate-900 mb-2">
          Comparative Component Breakdown
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              {candidates.map((c, idx) => (
                <Bar
                  key={c.id || idx}
                  dataKey={c.candidate_name || `Candidate ${idx + 1}`}
                  fill={CANDIDATE_COLORS[idx % CANDIDATE_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Side-by-Side Comparison Matrix Table */}
      <div className="card-surface overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-xs text-slate-800">
          Evaluation Matrix
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="p-4 w-48 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  Criteria
                </th>
                {candidates.map((c, idx) => (
                  <th key={c.id || idx} className="p-4 font-bold text-slate-900 border-l border-slate-100 min-w-[200px]">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CANDIDATE_COLORS[idx % CANDIDATE_COLORS.length] }}></span>
                      <span className="text-sm font-bold truncate">{c.candidate_name || 'Candidate'}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                      {c.candidate_uid}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {/* Composite Score */}
              <tr className="bg-slate-50/50">
                <td className="p-4 font-bold text-slate-900">Composite Score</td>
                {candidates.map((c, idx) => (
                  <td key={idx} className="p-4 border-l border-slate-100">
                    <div className="text-xl font-black text-slate-900">
                      {c.composite_score}%
                    </div>
                    <ScoreBadge score={c.composite_score} category={c.match_category} size="sm" />
                  </td>
                ))}
              </tr>

              {/* Semantic Similarity */}
              <tr>
                <td className="p-4 font-semibold text-slate-700">Semantic Similarity (40%)</td>
                {candidates.map((c, idx) => (
                  <td key={idx} className="p-4 border-l border-slate-100 font-semibold text-slate-900">
                    {c.scores?.semantic_similarity || 0}%
                  </td>
                ))}
              </tr>

              {/* Required Skills Match */}
              <tr>
                <td className="p-4 font-semibold text-slate-700">Required Skills Match (25%)</td>
                {candidates.map((c, idx) => (
                  <td key={idx} className="p-4 border-l border-slate-100 font-semibold text-slate-900">
                    {c.scores?.required_skills || 0}%
                  </td>
                ))}
              </tr>

              {/* Experience Match */}
              <tr>
                <td className="p-4 font-semibold text-slate-700">Experience Match (10%)</td>
                {candidates.map((c, idx) => (
                  <td key={idx} className="p-4 border-l border-slate-100">
                    <span className="font-semibold text-slate-900">
                      {c.scores?.experience || 0}%
                    </span>
                    <span className="text-slate-400 block text-[11px]">
                      ({c.candidate_extracted?.experience_years || 0} yrs detected)
                    </span>
                  </td>
                ))}
              </tr>

              {/* Education Match */}
              <tr>
                <td className="p-4 font-semibold text-slate-700">Education Match (5%)</td>
                {candidates.map((c, idx) => (
                  <td key={idx} className="p-4 border-l border-slate-100">
                    <span className="font-semibold text-slate-900">
                      {c.scores?.education || 0}%
                    </span>
                    <span className="text-slate-500 block text-[11px] truncate max-w-[200px]">
                      {c.candidate_extracted?.education?.join(', ') || 'None detected'}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Matched Required Skills */}
              <tr>
                <td className="p-4 font-semibold text-slate-700">Matched Required Skills</td>
                {candidates.map((c, idx) => {
                  const matched = c.skills_breakdown?.matched_required || [];
                  return (
                    <td key={idx} className="p-4 border-l border-slate-100">
                      <div className="flex flex-wrap gap-1">
                        {matched.map((s, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-medium border border-emerald-200">
                            {s}
                          </span>
                        ))}
                        {matched.length === 0 && <span className="text-slate-400 italic">None</span>}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Missing Required Skills */}
              <tr>
                <td className="p-4 font-semibold text-slate-700">Missing Required Skills</td>
                {candidates.map((c, idx) => {
                  const missing = c.skills_breakdown?.missing_required || [];
                  return (
                    <td key={idx} className="p-4 border-l border-slate-100">
                      <div className="flex flex-wrap gap-1">
                        {missing.map((s, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-medium border border-rose-200">
                            {s}
                          </span>
                        ))}
                        {missing.length === 0 && <span className="text-emerald-600 font-medium text-[11px]">All matched</span>}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Details Link */}
              <tr className="bg-slate-50/50">
                <td className="p-4 font-semibold text-slate-700">Detailed Analysis</td>
                {candidates.map((c, idx) => (
                  <td key={idx} className="p-4 border-l border-slate-100">
                    <Link
                      to={`/candidates/${c.candidate_id || c.id}?session_id=${c.session_id || ''}`}
                      className="inline-flex items-center space-x-1 text-brand-600 hover:text-brand-700 font-bold"
                    >
                      <span>Open Candidate Report</span>
                      <ArrowLeft className="w-3 h-3 rotate-180" />
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
