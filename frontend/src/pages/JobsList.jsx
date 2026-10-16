import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  FileCheck,
  Edit,
  Trash2,
  Calendar,
  Layers,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import apiService from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

export default function JobsList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getJobs();
      setJobs(res.jobs || []);
    } catch (err) {
      setError(err.message || 'Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the job "${title}" and all its screening records?`)) {
      return;
    }
    try {
      setDeletingId(id);
      await apiService.deleteJob(id);
      setJobs(jobs.filter((j) => j.id !== id));
    } catch (err) {
      alert(`Error deleting job: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const q = search.toLowerCase();
    const titleMatch = (job.title || '').toLowerCase().includes(q);
    const deptMatch = (job.department || '').toLowerCase().includes(q);
    const skillMatch = (job.required_skills || []).some((s) => s.toLowerCase().includes(q));
    return titleMatch || deptMatch || skillMatch;
  });

  if (loading) {
    return <LoadingSkeleton type="table" count={5} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Screening Jobs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage target roles, required skills, and screening criteria
          </p>
        </div>
        <Link
          to="/jobs/new"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Screening Job</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={fetchJobs} className="font-semibold underline">Retry</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card-surface p-3 flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search by job title, department, or required skill (e.g. Python, Docker)..."
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

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No screening jobs posted yet"
          description="Create your first job to define required qualifications and begin screening candidate resumes."
          actionText="Create Screening Job"
          actionLink="/jobs/new"
        />
      ) : filteredJobs.length === 0 ? (
        <div className="card-surface p-8 text-center text-xs text-slate-500">
          No jobs matched your search query "{search}".
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="card-surface p-5 card-hover flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                  <h3 className="text-base font-bold text-slate-900">{job.title}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {job.department || 'Engineering'}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 font-medium">
                    Min {job.min_experience_years || 0} yrs exp
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                {/* Skills Preview */}
                <div className="flex items-center flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1">Required:</span>
                  {(job.required_skills || []).slice(0, 6).map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-brand-50 text-brand-700 border border-brand-200"
                    >
                      {skill}
                    </span>
                  ))}
                  {(job.required_skills || []).length > 6 && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      +{(job.required_skills || []).length - 6} more
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 flex-shrink-0 self-end md:self-center">
                <Link
                  to={`/screenings/new?job_id=${job.id}`}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Screen Resumes</span>
                </Link>
                <Link
                  to={`/jobs/edit/${job.id}`}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Edit Job"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDelete(job.id, job.title)}
                  disabled={deletingId === job.id}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors"
                  title="Delete Job"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
