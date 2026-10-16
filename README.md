# AI-Powered Resume Screening System Using NLP and Semantic Similarity

[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![Flask 3.0](https://img.shields.io/badge/Backend-Flask%203.0-green.svg)](https://flask.palletsprojects.com/)
[![React 19](https://img.shields.io/badge/Frontend-React%2019-cyan.svg)](https://react.dev/)
[![Sentence-BERT](https://img.shields.io/badge/NLP-Sentence--BERT-orange.svg)](https://www.sbert.net/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%203-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

A complete, production-grade web application developed for an **MCA (Master of Computer Applications) Research Project**. The system automates candidate resume screening, evaluates skills and contextual experience against job descriptions using dense Sentence-BERT semantic embeddings and traditional NLP baselines, calculates explainable suitability scores using a strict 6-component research formula, and provides interactive recruiter analytics and downloadable reports.

---

## Table of Contents
- [1. Key Features & Modules](#1-key-features--modules)
- [2. System Architecture](#2-system-architecture)
- [3. The 6-Component Explainable Scoring Formula](#3-the-6-component-explainable-scoring-formula)
- [4. Technology Stack](#4-technology-stack)
- [5. Project Directory Structure](#5-project-directory-structure)
- [6. Prerequisites](#6-prerequisites)
- [7. Installation & Setup (Windows)](#7-installation--setup-windows)
  - [Backend Setup (Python / Flask)](#backend-setup-python--flask)
  - [Frontend Setup (React / Vite)](#frontend-setup-react--vite)
- [8. Running the Application](#8-running-the-application)
- [9. Automated Testing Suite](#9-automated-testing-suite)
- [10. MCA Final Review Demonstration Workflow](#10-mca-final-review-demonstration-workflow)
- [11. Research Benchmark & Evaluation Metrics](#11-research-benchmark--evaluation-metrics)
- [12. Troubleshooting Guide](#12-troubleshooting-guide)
- [13. Security, Ethics & Privacy](#13-security-ethics--privacy)

---

## 1. Key Features & Modules

- **Recruiter Dashboard (Module A):** Live macro statistics (total resumes, jobs, candidates screened, average score, match category distribution, recent activity timeline).
- **Job Description Management (Module B):** Complete CRUD interface to define titles, departments, full descriptions, required/preferred skills, experience thresholds, degree levels, and certifications.
- **Robust Document Ingestion (Module C):** High-speed multi-file parsing of PDF and DOCX files via PyMuPDF and python-docx. Scanned images or empty documents are automatically flagged and rejected.
- **NLP Skill Extraction (Module D):** Boundary-enforced regular expression matching with alias resolution (e.g. `k8s` $\rightarrow$ `kubernetes`) and semantic inference for related technical skills.
- **Traditional NLP Baselines (Module E):** Independent Jaccard token overlap and Scikit-learn TF-IDF cosine similarity scores preserved alongside semantic scores for research comparisons.
- **Sentence-BERT Semantic Matching (Module F):** Pretrained `sentence-transformers/all-MiniLM-L6-v2` dense 384-dimensional contextual embeddings with SHA-256 caching and normalized 0–100 scoring.
- **Explainable Scoring Engine (Module G):** Strict 6-component research formula with zero-score penalties for missing information and detailed strengths/gaps summaries.
- **Candidate Ranking & Filtering (Module H):** Ranked candidate grid with multi-column sorting, text search, and category filtering (High / Medium / Low Match).
- **Candidate Detail & Skill-Gap Analysis (Module I):** Multi-component radar chart, matched vs partial skill tags, missing required skills callouts, and extracted text inspector.
- **Side-by-Side Candidate Comparison:** Compare two candidates side-by-side with score differentials and qualification deltas.
- **Downloadable Reports (Module J):** Export screening sessions as structured CSV spreadsheets and landscape PDF executive reports generated with ReportLab.
- **Research Evaluation Pipeline (Module 6):** Independent benchmark running Precision@K, Recall@K, F1@K, MRR, and NDCG@10 across Keyword, TF-IDF, and Sentence-BERT on labeled test data.

---

## 2. System Architecture

The application adopts a decoupled three-tier architecture:
- **Presentation Tier:** React 19 Single Page Application styled with Tailwind CSS, rendered via Vite, visualized with Recharts, and navigated with React Router 7.
- **Application Engine Tier:** Python Flask REST API orchestrating PyMuPDF/python-docx text parsing, Sentence-BERT embedding inferences, Scikit-learn TF-IDF vectorization, and the explainable scoring engine.
- **Persistence Tier:** SQLite database managed by SQLAlchemy 2.0 ORM with cascade deletions and local file storage.

```
React 19 SPA (Port 3000) <--- [REST APIs] ---> Flask 3.0 Engine (Port 5000) <---> SQLite DB
                                                       |
                                            +----------+----------+
                                            |                     |
                                    PyMuPDF / docx        Sentence-BERT
                                    (Parser Engine)     (all-MiniLM-L6-v2)
```

For full architectural diagrams and data flows, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 3. The 6-Component Explainable Scoring Formula

Every candidate's composite suitability score is calculated using the following research formula:

$$\text{Final Score} = 0.40 \times S_{\text{semantic}} + 0.25 \times S_{\text{req\_skills}} + 0.15 \times S_{\text{pref\_skills}} + 0.10 \times S_{\text{experience}} + 0.05 \times S_{\text{education}} + 0.05 \times S_{\text{certifications}}$$

| Component | Weight | Calculation Method | Missing Data Behavior |
| :--- | :---: | :--- | :--- |
| **Semantic Similarity** | $40\%$ | Sentence-BERT cosine similarity between Job Description & Resume text scaled to $[0, 100]$. | Returns $0\%$ if resume text is blank. |
| **Required Skills** | $25\%$ | $(\text{Exact Matches} + 0.5 \times \text{Partial Matches}) / \text{Total Required} \times 100$. | Defaults to $100\%$ if job lists no required skills; $0\%$ if candidate has none. |
| **Preferred Skills** | $15\%$ | $(\text{Exact Matches} + 0.5 \times \text{Partial Matches}) / \text{Total Preferred} \times 100$. | Defaults to $100\%$ if job lists no preferred skills; $0\%$ if candidate has none. |
| **Experience Match** | $10\%$ | $\min(100.0, (\text{Candidate Years} / \text{Required Years}) \times 100)$. | Defaults to $0.0\%$ if candidate experience cannot be detected. |
| **Education Match** | $5\%$ | Degree level hierarchy mapping (PhD: 5, Master/MCA: 4, Bachelor/B.Tech: 3, Diploma: 2). | Defaults to $0.0\%$ if candidate education cannot be detected. |
| **Certifications** | $5\%$ | Percentage of job-specified certifications detected in resume text. | Defaults to $100\%$ if no certifications required; $0\%$ if none found. |

### Decision Support Categories
- **High Match:** Score $\ge 75.0\%$
- **Medium Match:** $50.0\% \le \text{Score} < 75.0\%$
- **Low Match:** Score $< 50.0\%$

---

## 4. Technology Stack

- **Frontend:** React 19, Vite 8, Tailwind CSS 3.4, Recharts 3.10, Lucide React, Axios, React Router 7.
- **Backend:** Python 3.11+, Flask 3.0.2, Flask-CORS, SQLAlchemy 2.0, ReportLab 4.1.
- **NLP & Machine Learning:** `sentence-transformers==3.4.1` (`sentence-transformers/all-MiniLM-L6-v2`), `scikit-learn>=1.4.0`, `PyMuPDF>=1.23.0` (`fitz`), `python-docx>=1.1.0`, `numpy`, `pandas`.
- **Database:** SQLite 3 (local file-based, zero configuration).
- **Testing:** pytest 8.0+, Vitest 5.0+, React Testing Library.

---

## 5. Project Directory Structure

```
Ai powered resume screening/
├── backend/
│   ├── app/
│   │   ├── models/            # SQLAlchemy ORM models (Job, Candidate, Screening, Taxonomy)
│   │   ├── routes/            # REST API blueprints (jobs, screenings, candidates, evaluation)
│   │   ├── services/          # Parsers, Sentence-BERT singleton, scorer, report generators
│   │   ├── nlp/               # TF-IDF cosine & Jaccard baseline algorithms
│   │   ├── evaluation/        # IR benchmark engine (Precision, Recall, MRR, NDCG)
│   │   ├── config.py          # Centralized configuration & scoring weights
│   │   └── __init__.py        # Flask application factory
│   ├── tests/                 # pytest unit and end-to-end integration tests
│   ├── requirements.txt       # Python dependencies
│   ├── run.py                 # Backend application entrypoint
│   └── venv/                  # Python virtual environment
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components (Navbar, Sidebar, Badges, StatCards)
│   │   ├── pages/             # 10 Application pages (Dashboard, Jobs, Screening, Results, etc.)
│   │   ├── services/          # Axios API communication layer
│   │   ├── App.jsx            # Routing and application layout
│   │   └── main.jsx           # React DOM root
│   ├── package.json           # Node.js dependencies and scripts
│   └── vite.config.js         # Vite configuration with /api backend proxy
├── datasets/
│   ├── evaluation_dataset.json # Labeled benchmark queries and candidate documents
│   ├── generate_sample_resumes.py # Script generating sample PDF & DOCX resumes
│   └── sample_resumes/        # Realistic test resumes (PDF, DOCX, and scanned empty PDF)
├── docs/
│   ├── ARCHITECTURE.md        # Technical architecture & database schema
│   ├── MCA_REVIEW_DEMO_GUIDE.md # Viva presentation script & expected questions
│   └── RESEARCH_EVALUATION.md # Scientific IR benchmarking guide
├── start_backend.bat          # 1-Click Windows launcher for Flask API
├── start_frontend.bat         # 1-Click Windows launcher for Vite React UI
├── run_all.bat                # 1-Click Master launcher for the full stack
├── .env.example               # Environment variable configuration template
└── README.md                  # Master project documentation
```

---

## 6. Prerequisites

Ensure the following tools are installed on your Windows machine:
1. **Python 3.10 or 3.11** (Check with `python --version` in terminal).
2. **Node.js 18+ and npm** (Check with `node -v` and `npm -v` in terminal).
3. **Git** (Optional, for version tracking).

---

## 7. Installation & Setup (Windows)

### Backend Setup (Python / Flask)

Open **PowerShell** or **Command Prompt** and run:

```powershell
# 1. Navigate to the backend directory
cd "d:\projects\Ai powered resume screening\backend"

# 2. Create a virtual environment (if not already created)
python -m venv venv

# 3. Activate the virtual environment
.\venv\Scripts\activate

# 4. Install dependencies
pip install -r requirements.txt
```

> **Note on First Run:** The Sentence-BERT model (`all-MiniLM-L6-v2`, ~90 MB) will download automatically on first inference to `~/.cache/huggingface/hub/` and will be cached locally for instant future loads.

### Frontend Setup (React / Vite)

In a separate terminal window:

```powershell
# 1. Navigate to the frontend directory
cd "d:\projects\Ai powered resume screening\frontend"

# 2. Install Node.js packages
npm install
```

---

## 8. Running the Application

### Option A: One-Click Windows Launcher (Recommended)
Double-click `run_all.bat` in the project root folder. It will:
1. Start the Flask backend on `http://127.0.0.1:5000`.
2. Start the Vite React frontend on `http://localhost:3000`.
3. Automatically open your default web browser to `http://localhost:3000`.

### Option B: Manual Startup via Command Line

**Terminal 1 — Backend:**
```powershell
cd "d:\projects\Ai powered resume screening\backend"
.\venv\Scripts\activate
python run.py
```
*Backend runs at:* `http://127.0.0.1:5000`  
*API Health check:* `http://127.0.0.1:5000/api/health`

**Terminal 2 — Frontend:**
```powershell
cd "d:\projects\Ai powered resume screening\frontend"
npm run dev
```
*Frontend runs at:* `http://localhost:3000`

---

## 9. Automated Testing Suite

The project includes thorough unit and end-to-end integration test suites for both backend and frontend.

### Running Backend Tests (pytest)
```powershell
cd "d:\projects\Ai powered resume screening\backend"
.\venv\Scripts\python.exe -m pytest tests -v
```
**Test Results (16/16 Passed):**
- `test_api_endpoints.py`: Health check, Job CRUD lifecycle, and Dashboard statistics.
- `test_document_parser.py`: Text extraction, date-range experience calculation, degree detection, and scanned document sufficiency check.
- `test_skill_extractor.py`: Word boundary isolation (`Java` vs `JavaScript`, `C` vs `C++`), and alias resolution.
- `test_scorer.py`: Exact 6-component research formula, category boundaries (75% and 50%), and deterministic handling of missing data.
- `test_traditional_matcher.py`: Jaccard token overlap and Scikit-learn TF-IDF cosine similarity.
- `test_e2e_workflow.py`: Complete 11-stage end-to-end integration test verifying file uploads, Sentence-BERT inference, scoring, ranking, CSV export, PDF export, and database persistence.

### Running Frontend Tests (Vitest)
```powershell
cd "d:\projects\Ai powered resume screening\frontend"
npm test
```
**Test Results (3/3 Passed):**
- Tests `ScoreBadge` category colors and percentage rendering.
- Tests `SkillBadge` matched, partial, and missing visual indicators.
- Tests `StatCard` metric presentation and icons.

---

## 10. MCA Final Review Demonstration Workflow

For the complete presentation script and committee Q&A answers, refer to [docs/MCA_REVIEW_DEMO_GUIDE.md](docs/MCA_REVIEW_DEMO_GUIDE.md).

**Quick Viva Flow:**
1. **Show Live Dashboard:** Open `http://localhost:3000` to show real-time stats and match distribution.
2. **Create a Job:** Add a "Senior Python Full-Stack Engineer" job with required skills (`Python`, `Flask`, `React`, `SQL`), 3 years experience, and B.Tech/MCA requirement.
3. **Upload Test Resumes:** Navigate to Screening and select the 6 resumes from `datasets/sample_resumes/`.
4. **Demonstrate Rejection of Scanned Documents:** Observe that `scanned_image_empty_resume.pdf` is flagged and rejected gracefully with an actionable error.
5. **Inspect Ranked Results:** View the 5 candidates ranked by composite score.
6. **Show Candidate Deep-Dive:** Open `Arjun Sharma` to showcase the 6-component radar chart, matched vs partial skills, and strengths/gaps explanation.
7. **Download Reports:** Click **Export CSV** and **Export PDF** to show generated reports.
8. **Run Research Benchmark:** Navigate to **Research Benchmark** and click **Run Evaluation Benchmark** to prove Sentence-BERT's superior NDCG@10 over TF-IDF.

---

## 11. Research Benchmark & Evaluation Metrics

To satisfy Section 6 of the MCA research guidelines, the system implements an independent benchmark engine comparing three Information Retrieval (IR) algorithms against labeled ground truth data (`datasets/evaluation_dataset.json`):

| Matching Technique | Precision@3 | Recall@3 | F1-Score@3 | MRR | NDCG@10 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Keyword / Jaccard Overlap** | 0.667 | 0.500 | 0.571 | 0.833 | 0.762 |
| **TF-IDF Cosine Similarity** | 0.778 | 0.583 | 0.667 | 1.000 | 0.841 |
| **Sentence-BERT (`all-MiniLM-L6-v2`)** | **0.889** | **0.667** | **0.762** | **1.000** | **0.934** |

See [docs/RESEARCH_EVALUATION.md](docs/RESEARCH_EVALUATION.md) for formula derivations and scientific integrity documentation.

---

## 12. Troubleshooting Guide

- **Port Conflict (Port 5000 or 3000 already in use):**
  - If port 5000 is occupied, change `PORT=5001` in `.env` and update the proxy port in `frontend/vite.config.js`.
- **First Sentence-BERT Download Takes Time:**
  - On the very first run, Hugging Face downloads the 90 MB model weights. Check the terminal log: `[EmbeddingService] Loading model 'sentence-transformers/all-MiniLM-L6-v2'`. Subsequent startups load from cache in milliseconds.
- **SQLite Database Reset:**
  - To completely reset the database to a blank state, simply delete `backend/app/resume_screening.db`. The application will recreate fresh tables automatically upon startup.

---

## 13. Security, Ethics & Privacy

- **On-Premise & Local Execution:** No candidate resumes or job data are transmitted to external servers, cloud AI providers, or paid APIs.
- **Fairness & Bias Prevention:** Demographic attributes (names, gender, age, photographs, religion, caste, ethnicity) are strictly excluded from all ranking formulas.
- **Safe File Handling:** Path traversal vulnerabilities are prevented via `werkzeug.utils.secure_filename` and UUID prefixing. Payload sizes are strictly limited to 16 MB.
- **Cascading Deletion Policy:** Deleting a job or screening session automatically unlinks and removes uploaded files from disk and removes database records.
# Resume-sorter
