import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import JobsList from './pages/JobsList';
import JobForm from './pages/JobForm';
import ScreeningUpload from './pages/ScreeningUpload';
import CandidateResults from './pages/CandidateResults';
import CandidateDetail from './pages/CandidateDetail';
import CandidateCompare from './pages/CandidateCompare';
import ScreeningHistory from './pages/ScreeningHistory';
import ResearchEvaluation from './pages/ResearchEvaluation';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />

        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/jobs" element={<JobsList />} />
              <Route path="/jobs/new" element={<JobForm />} />
              <Route path="/jobs/edit/:id" element={<JobForm />} />
              <Route path="/screenings/new" element={<ScreeningUpload />} />
              <Route path="/candidates" element={<CandidateResults />} />
              <Route path="/candidates/:id" element={<CandidateDetail />} />
              <Route path="/compare" element={<CandidateCompare />} />
              <Route path="/history" element={<ScreeningHistory />} />
              <Route path="/evaluation" element={<ResearchEvaluation />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
