import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Briefcase,
  Save,
  ArrowLeft,
  Sparkles,
  Plus,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import apiService from '../services/api';

export default function JobForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    department: 'Engineering',
    description: '',
    required_skills: [],
    preferred_skills: [],
    min_experience_years: 2.0,
    education_requirements: ["Bachelor's Degree"],
    certifications: []
  });

  const [reqInput, setReqInput] = useState('');
  const [prefInput, setPrefInput] = useState('');
  const [eduInput, setEduInput] = useState('');
  const [certInput, setCertInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState(null);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    if (isEdit) {
      apiService.getJob(id)
        .then((res) => {
          const j = res.job;
          setFormData({
            title: j.title || '',
            department: j.department || 'Engineering',
            description: j.description || '',
            required_skills: j.required_skills || [],
            preferred_skills: j.preferred_skills || [],
            min_experience_years: j.min_experience_years || 0.0,
            education_requirements: j.education_requirements || [],
            certifications: j.certifications || []
          });
        })
        .catch((err) => setError(err.message || 'Failed to fetch job.'))
        .finally(() => setFetchLoading(false));
    }
  }, [id, isEdit]);

  const addTag = (field, value, clearFn) => {
    const val = value.trim();
    if (val && !formData[field].includes(val)) {
      setFormData((prev) => ({ ...prev, [field]: [...prev[field], val] }));
      clearFn('');
    }
  };

  const removeTag = (field, tag) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((t) => t !== tag)
    }));
  };

  // NLP Automatic skill extraction from the job description
  const handleAutoExtractSkills = async () => {
    if (!formData.description.trim()) {
      alert('Please enter a job description first.');
      return;
    }
    setExtracting(true);
    try {
      // Use temporary job creation or client-side keyword ontology
      const res = await apiService.getTaxonomy();
      const tax = res.taxonomy || {};
      const descLower = formData.description.toLowerCase();
      const extracted = new Set();

      Object.values(tax).forEach((group) => {
        Object.entries(group).forEach(([canon, aliases]) => {
          const names = [canon.toLowerCase(), ...aliases.map((a) => a.toLowerCase())];
          if (names.some((name) => descLower.includes(name))) {
            extracted.add(canon);
          }
        });
      });

      const newSkills = Array.from(extracted);
      if (newSkills.length === 0) {
        alert('No canonical skills found in description. You can add them manually.');
      } else {
        setFormData((prev) => ({
          ...prev,
          required_skills: Array.from(new Set([...prev.required_skills, ...newSkills]))
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Job title is required.');
      return;
    }
    if (!formData.description.trim()) {
      setError('Job description is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEdit) {
        await apiService.updateJob(id, formData);
      } else {
        await apiService.createJob(formData);
      }
      navigate('/jobs');
    } catch (err) {
      setError(err.message || 'Failed to save job.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <div className="card-surface p-12 text-center text-xs text-slate-500">Loading job details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to="/jobs"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {isEdit ? 'Edit Screening Job' : 'Create New Screening Job'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Define the requirements, required skills, and qualification thresholds
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="card-surface p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Job Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Python Backend Engineer"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Department</label>
            <input
              type="text"
              placeholder="e.g. Engineering, Data Science"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>
        </div>

        {/* Job Description with Auto-Extract Action */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              Job Description <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleAutoExtractSkills}
              disabled={extracting}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{extracting ? 'Analyzing...' : 'Auto-Extract Skills with NLP'}</span>
            </button>
          </div>
          <textarea
            rows={5}
            required
            placeholder="Paste complete job description, responsibilities, technical expectations, and cloud technologies..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white leading-relaxed"
          />
        </div>

        {/* Required Skills Tag Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700">
            Required Technical Skills (25% Weight in Research Formula)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Type skill (e.g. Python, Docker, PostgreSQL) and press Add..."
              value={reqInput}
              onChange={(e) => setReqInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag('required_skills', reqInput, setReqInput);
                }
              }}
              className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
            <button
              type="button"
              onClick={() => addTag('required_skills', reqInput, setReqInput)}
              className="px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {formData.required_skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-brand-50 text-brand-700 border border-brand-200"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => removeTag('required_skills', skill)}
                  className="hover:text-rose-500 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {formData.required_skills.length === 0 && (
              <span className="text-[11px] text-slate-400 italic">No required skills added yet.</span>
            )}
          </div>
        </div>

        {/* Preferred Skills Tag Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700">
            Preferred / Nice-to-Have Skills (15% Weight in Research Formula)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Type preferred skill (e.g. Kubernetes, Redis, AWS) and press Add..."
              value={prefInput}
              onChange={(e) => setPrefInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag('preferred_skills', prefInput, setPrefInput);
                }
              }}
              className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
            <button
              type="button"
              onClick={() => addTag('preferred_skills', prefInput, setPrefInput)}
              className="px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {formData.preferred_skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => removeTag('preferred_skills', skill)}
                  className="hover:text-rose-500 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Experience, Education & Certifications Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Min Experience (Years) (10% Weight)
            </label>
            <input
              type="number"
              min="0"
              max="30"
              step="0.5"
              value={formData.min_experience_years}
              onChange={(e) => setFormData({ ...formData, min_experience_years: parseFloat(e.target.value) || 0 })}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Education Requirement (5% Weight)</label>
            <div className="flex items-center space-x-1.5">
              <input
                type="text"
                placeholder="e.g. B.Tech, MCA, BS"
                value={eduInput}
                onChange={(e) => setEduInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag('education_requirements', eduInput, setEduInput);
                  }
                }}
                className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
              <button
                type="button"
                onClick={() => addTag('education_requirements', eduInput, setEduInput)}
                className="px-3 py-2.5 rounded-lg bg-slate-800 text-white text-xs font-semibold"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {formData.education_requirements.map((edu) => (
                <span key={edu} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 flex items-center space-x-1">
                  <span>{edu}</span>
                  <button type="button" onClick={() => removeTag('education_requirements', edu)} className="hover:text-rose-500">×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Certifications (5% Weight)</label>
            <div className="flex items-center space-x-1.5">
              <input
                type="text"
                placeholder="e.g. AWS, CKA"
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag('certifications', certInput, setCertInput);
                  }
                }}
                className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
              <button
                type="button"
                onClick={() => addTag('certifications', certInput, setCertInput)}
                className="px-3 py-2.5 rounded-lg bg-slate-800 text-white text-xs font-semibold"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {formData.certifications.map((cert) => (
                <span key={cert} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 flex items-center space-x-1">
                  <span>{cert}</span>
                  <button type="button" onClick={() => removeTag('certifications', cert)} className="hover:text-rose-500">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
          <Link
            to="/jobs"
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Job...' : isEdit ? 'Update Job' : 'Save Job Post'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
