import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  FileCheck,
  TrendingUp,
  Award,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import apiService from '../services/api';
import StatCard from '../components/StatCard';
import ScoreBadge from '../components/ScoreBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

const CATEGORY_COLORS = {
  'High Match (≥75%)': '#10B981',
  'Medium Match (50-74%)': '#F59E0B',
  'Low Match (<50%)': '#EF4444',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getDashboardStats();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="cards" />
        <LoadingSkeleton type="table" count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
        <button
          onClick={fetchStats}
          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};
  const recentSessions = data?.recent_sessions || [];
  const recentActivities = data?.recent_activities || [];
  const matchDistribution = charts.match_distribution || [];

  const hasData = metrics.total_candidates_screened > 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 p-8 text-white shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-brand-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NLP & Sentence-BERT Semantic Similarity</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            AI-Powered Resume Screening System
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Screen candidates with high explainability using dense vector embeddings,
            domain-specific skill extraction, and research-validated multi-criteria scoring.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/screenings/new"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-sm transition-all"
            >
              <FileCheck className="w-4 h-4" />
              <span>Start New Screening</span>
            </Link>
            <Link
              to="/jobs/new"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-semibold transition-all"
            >
              <Briefcase className="w-4 h-4" />
              <span>Post New Job</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Resumes"
          value={metrics.total_resumes_processed || 0}
          subtitle="Processed in database"
          icon={Users}
          color="brand"
        />
        <StatCard
          title="Screening Jobs"
          value={metrics.total_jobs || 0}
          subtitle="Active job postings"
          icon={Briefcase}
          color="indigo"
        />
        <StatCard
          title="Avg Candidate Score"
          value={`${metrics.average_score || 0}%`}
          subtitle="Across all evaluations"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="High Matches"
          value={metrics.high_match_count || 0}
          subtitle="≥75% Composite Score"
          icon={Award}
          color="amber"
        />
      </div>

      {/* Charts & Analytics Section */}
      {hasData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Match Category Doughnut */}
          <div className="card-surface p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                Match Distribution Breakdown
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Categorized candidate suitability
              </p>
            </div>
            <div className="h-56 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={matchDistribution}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {matchDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[entry.name] || '#94A3B8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val} Candidates`, name]}
                    contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 block uppercase">High</span>
                <span className="text-lg font-bold text-slate-800">{metrics.high_match_count || 0}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-600 block uppercase">Medium</span>
                <span className="text-lg font-bold text-slate-800">{metrics.medium_match_count || 0}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-rose-600 block uppercase">Low</span>
                <span className="text-lg font-bold text-slate-800">{metrics.low_match_count || 0}</span>
              </div>
            </div>
          </div>

          {/* Screening Activity Timeline / Recent Activities */}
          <div className="lg:col-span-2 card-surface p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                  Recent Screening Activities
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest evaluated batches and candidate metrics
                </p>
              </div>
              <Link to="/history" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center">
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {recentActivities.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No screening sessions logged yet.</p>
              ) : (
                recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-brand-100/70 text-brand-700 flex items-center justify-center font-bold text-xs">
                        {act.high_count}★
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{act.title}</p>
                        <p className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                          <span className="font-mono text-[11px] text-slate-600">{act.session_uid}</span>
                          <span>•</span>
                          <span>Avg Score: <b>{act.avg_score}%</b></span>
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/candidates?session_id=${act.id}`}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:text-brand-600 hover:border-brand-300 shadow-2xs"
                    >
                      View Results
                    </Link>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Scientific Explainability: Formula 0.40 S-BERT + 0.25 Req + 0.15 Pref + 0.10 Exp + 0.05 Edu + 0.05 Cert</span>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No Screening Data Yet"
          description="Start by creating a job description with technical requirements, then upload PDF or DOCX resumes to generate candidate rankings."
          actionText="Screen Your First Batch"
          actionLink="/screenings/new"
        />
      )}

      {/* Recent Screening Sessions Table */}
      {recentSessions.length > 0 && (
        <div className="card-surface overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                Recent Screening Sessions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Click a session to inspect ranked candidate suitability
              </p>
            </div>
            <Link to="/history" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center">
              <span>Full History</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Session UID</th>
                  <th className="py-3 px-4">Job Title</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Resumes</th>
                  <th className="py-3 px-4">Avg Score</th>
                  <th className="py-3 px-4">High Matches</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{s.session_uid}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{s.job_title}</td>
                    <td className="py-3 px-4 text-slate-500">{s.department || 'Engineering'}</td>
                    <td className="py-3 px-4">{s.total_resumes} candidates</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{s.average_score}%</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {s.high_match_count} high
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/candidates?session_id=${s.id}`}
                        className="inline-flex items-center space-x-1 text-brand-600 hover:text-brand-700 font-semibold"
                      >
                        <span>Rankings</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
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
