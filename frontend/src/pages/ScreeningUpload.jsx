import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  Play,
  ArrowRight,
  Info
} from 'lucide-react';
import apiService from '../services/api';
import ScreeningProgress from './ScreeningProgress';

export default function ScreeningUpload() {
  const [searchParams] = useSearchParams();
  const preselectedJobId = searchParams.get('job_id');
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(preselectedJobId || '');
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [currentStage, setCurrentStage] = useState(0); // 0=upload, 1=extract, 2=nlp, 3=sbert, 4=score
  const [error, setError] = useState(null);
  const [fileErrors, setFileErrors] = useState([]);

  const fileInputRef = useRef(null);

  useEffect(() => {
    apiService.getJobs()
      .then((res) => {
        const jobList = res.jobs || [];
        setJobs(jobList);
        if (!selectedJobId && jobList.length > 0) {
          setSelectedJobId(jobList[0].id.toString());
        }
      })
      .catch((err) => setError('Failed to load available screening jobs.'));
  }, []);

  const handleFiles = (incomingFiles) => {
    const validExtensions = ['pdf', 'docx'];
    const maxSizeBytes = 16 * 1024 * 1024;
    const newValidFiles = [];
    const localErrors = [];

    Array.from(incomingFiles).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!validExtensions.includes(ext)) {
        localErrors.push(`"${file.name}": Unsupported format. Only PDF and DOCX are allowed.`);
        return;
      }
      if (file.size > maxSizeBytes) {
        localErrors.push(`"${file.name}": Exceeds maximum 16MB file limit.`);
        return;
      }
      // Check duplicate within currently added list
      if (files.some((f) => f.name === file.name && f.size === file.size)) {
        localErrors.push(`"${file.name}": Already added to upload list.`);
        return;
      }
      newValidFiles.push(file);
    });

    setFiles((prev) => [...prev, ...newValidFiles]);
    if (localErrors.length > 0) {
      setFileErrors(localErrors);
    } else {
      setFileErrors([]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const startScreening = async () => {
    if (!selectedJobId) {
      setError('Please select a target job description.');
      return;
    }
    if (files.length === 0) {
      setError('Please upload at least one valid resume (PDF or DOCX).');
      return;
    }

    setUploading(true);
    setError(null);
    setFileErrors([]);
    setCurrentStage(1); // Document extraction

    const formData = new FormData();
    formData.append('job_id', selectedJobId);
    files.forEach((file) => {
      formData.append('resumes', file);
    });

    // Simulate animated stage transitions while server computes embeddings
    const stageTimer1 = setTimeout(() => setCurrentStage(2), 1200); // Skill extraction
    const stageTimer2 = setTimeout(() => setCurrentStage(3), 2800); // Sentence-BERT inference
    const stageTimer3 = setTimeout(() => setCurrentStage(4), 5000); // 6-Component Scoring

    try {
      const response = await apiService.startScreening(formData, (percent) => {
        setUploadPercent(percent);
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      setCurrentStage(5); // Complete

      // Brief delay to allow completion animation to render
      setTimeout(() => {
        const sessionId = response.session?.id;
        navigate(`/candidates?session_id=${sessionId}`);
      }, 900);
    } catch (err) {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      setUploading(false);
      setError(err.message || 'Screening failed during text extraction or model inference.');
    }
  };

  const selectedJob = jobs.find((j) => j.id.toString() === selectedJobId.toString());

  if (uploading) {
    return (
      <ScreeningProgress
        stage={currentStage}
        totalFiles={files.length}
        uploadPercent={uploadPercent}
        jobTitle={selectedJob?.title || 'Screening Job'}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Screen Candidate Resumes</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Upload resumes in PDF or DOCX format for NLP skill extraction and Sentence-BERT semantic matching
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      {/* Target Job Selection Card */}
      <div className="card-surface p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-brand-600" />
            <span>Step 1: Select Target Screening Job</span>
          </label>
          <Link to="/jobs/new" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
            + Create New Job
          </Link>
        </div>

        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        >
          {jobs.length === 0 ? (
            <option value="">No jobs available. Create one first.</option>
          ) : (
            jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} — {job.department || 'Engineering'} (Min {job.min_experience_years || 0} yrs exp)
              </option>
            ))
          )}
        </select>

        {selectedJob && (
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="font-semibold text-slate-700">Required Skills:</span>
              {(selectedJob.required_skills || []).map((s, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-medium text-[11px] border border-brand-200">
                  {s}
                </span>
              ))}
            </div>
            {selectedJob.preferred_skills?.length > 0 && (
              <div className="flex items-center flex-wrap gap-1.5">
                <span className="font-semibold text-slate-700">Preferred Skills:</span>
                {selectedJob.preferred_skills.map((s, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-medium text-[11px]">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drag & Drop Upload Zone */}
      <div className="card-surface p-6 space-y-4">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
          <UploadCloud className="w-4 h-4 text-brand-600" />
          <span>Step 2: Upload Resumes (PDF & DOCX)</span>
        </label>

        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-brand-500 bg-brand-50/50 scale-[1.01]'
              : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <UploadCloud className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-slate-800">
            Click to upload or drag and drop multiple resumes
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Supports PDF and DOCX documents (up to 16MB per file)
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            Tip: Scanned image-only PDFs without an embedded text layer will be flagged gracefully.
          </p>
        </div>

        {/* Validation warnings */}
        {fileErrors.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
            {fileErrors.map((fe, i) => (
              <p key={i} className="text-xs text-amber-800 flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
                <span>{fe}</span>
              </p>
            ))}
          </div>
        )}

        {/* Uploaded Files Queue */}
        {files.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Resumes Ready for Screening ({files.length})
              </span>
              <button
                type="button"
                onClick={() => setFiles([])}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                Clear All
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <FileText className="w-4 h-4 text-brand-600 flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-800 truncate">{file.name}</span>
                    <span className="text-[11px] text-slate-400 flex-shrink-0">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Start Screening Action */}
      <div className="flex justify-end">
        <button
          onClick={startScreening}
          disabled={files.length === 0 || !selectedJobId}
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Start AI Screening & Ranking</span>
        </button>
      </div>
    </div>
  );
}
