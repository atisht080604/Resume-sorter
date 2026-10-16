# System Architecture & Technical Specifications

**Project Title:** AI-Powered Resume Screening System Using NLP and Semantic Similarity  
**Degree / Academic Level:** Master of Computer Applications (MCA) Final Review  
**Target Environment:** Local On-Premise Execution (No paid external APIs or cloud dependencies)

---

## 1. High-Level Architectural Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|  React 19 + Vite 8 SPA | Tailwind CSS | Recharts | React Router 7 | Lucide Icons |
+-----------------------------------------------------------------------------------+
                                         |
                                (HTTP / REST APIs)
                                         v
+-----------------------------------------------------------------------------------+
|                                APPLICATION TIER                                   |
|                        Flask 3.0.2 REST Application Engine                        |
|                                                                                   |
|  +-----------------+  +-----------------+  +------------------+  +--------------+ |
|  | Jobs Controller |  | Screening Route |  | Candidate Detail |  |  Evaluation  | |
|  +-----------------+  +-----------------+  +------------------+  +--------------+ |
|                                |                                                  |
|       +------------------------+-------------------------+                        |
|       |                                                  |                        |
|       v                                                  v                        |
|  +---------------------------+              +---------------------------+         |
|  |     DOCUMENT PARSER       |              |       NLP & SEMANTIC      |         |
|  |  - PyMuPDF (fitz) for PDF |              |  - Sentence-BERT Model    |         |
|  |  - python-docx for DOCX   |              |    (all-MiniLM-L6-v2)     |         |
|  |  - Scanned PDF Detection  |              |  - TF-IDF Cosine Baseline |         |
|  |  - Section Normalization  |              |  - Jaccard Token Overlap  |         |
|  +---------------------------+              |  - Regex Skill Taxonomy   |         |
|                                             +---------------------------+         |
|                                                          |                        |
|                                                          v                        |
|                                             +---------------------------+         |
|                                             |    EXPLAINABLE SCORER     |         |
|                                             |  - 6 Weighted Components  |         |
|                                             |  - Missing Info Penalty   |         |
|                                             |  - Strengths & Gaps       |         |
|                                             +---------------------------+         |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                                PERSISTENCE TIER                                   |
|                     SQLAlchemy 2.0 ORM  |  SQLite Database                        |
|                                                                                   |
|  - Job               - Candidate            - ScreeningSession                    |
|  - ScreeningResult   - SkillTaxonomy        - File Storage (/uploads)             |
+-----------------------------------------------------------------------------------+
```

---

## 2. Component Breakdown

### 2.1 Frontend Client (`frontend/`)
- **Vite 8 & React 19:** Single Page Application (SPA) providing fast hot-module replacement and instant navigation.
- **Tailwind CSS:** Modern, responsive design system adhering strictly to the required clean aesthetic: white/light-slate surfaces, dark-slate typography, and indigo/slate accents.
- **Recharts:** Interactive visualizations for score distribution (bar charts), category breakdowns (donut/pie charts), and radar charts for multi-component comparison.
- **Axios Client:** Unified HTTP client with automatic base URL routing (`/api`) and Vite dev server proxying to avoid CORS friction in local development.
- **Pages (10 Complete Modules):**
  1. `Dashboard.jsx`: Live macro analytics, recent screening activities, match distribution.
  2. `JobsList.jsx`: Searchable list of screening jobs with candidate counts and actions.
  3. `JobForm.jsx`: Create & edit job requirements, required/preferred skills, experience, and degree levels.
  4. `ScreeningUpload.jsx`: Multi-file drag-and-drop supporting PDF and DOCX documents.
  5. `ScreeningProgress.jsx`: Multi-stage processing monitor with animated step badges.
  6. `CandidateResults.jsx`: Ranked candidate grid with multi-filter, search, and CSV/PDF export buttons.
  7. `CandidateDetail.jsx`: Deep-dive candidate profile, 6-component breakdown, radar chart, matched/partial/missing skills, strengths and gap analysis.
  8. `CandidateCompare.jsx`: Side-by-side comparative inspection between multiple candidates.
  9. `ScreeningHistory.jsx`: Complete audit log of past screening sessions and candidates per job.
  10. `ResearchEvaluation.jsx`: Scientific Information Retrieval (IR) benchmark comparing Keyword, TF-IDF, and Sentence-BERT against ground truth labels.
  11. `Settings.jsx`: Configurable scoring weights, semantic similarity thresholds, and skill taxonomy browser.

### 2.2 Backend Application Engine (`backend/app/`)
- **App Factory Pattern (`__init__.py`):** Configures Flask, SQLAlchemy, CORS, and blueprint routing.
- **Configuration Management (`config.py`):** Centralizes file upload limits (16 MB), model parameters, allowed extensions, and default scoring weights.
- **REST Endpoints:**
  - `/api/health`: Health status and model readiness.
  - `/api/dashboard/stats`: Aggregated database metrics for dashboard charts.
  - `/api/jobs`: Full CRUD lifecycle for screening jobs.
  - `/api/screenings`: Multipart upload, validation, parsing, semantic embedding, scoring, and persistence.
  - `/api/candidates/<id>`: Full candidate profile with extracted sections and component scores.
  - `/api/screenings/<id>/export`: Downloadable CSV and landscape ReportLab PDF reports.
  - `/api/evaluation/run`: Benchmarks Precision@K, Recall@K, F1@K, MRR, and NDCG@10.
  - `/api/settings/weights`: Configurable scoring weights.

### 2.3 NLP & Semantic Pipeline (`backend/app/services/` & `nlp/`)
1. **Document Parsing (`document_parser.py`):**
   - **PyMuPDF (`fitz`):** High-speed PDF text and page extraction.
   - **python-docx:** DOCX XML paragraph and table extraction.
   - **Sufficiency & Scanned Document Guard:** Computes non-whitespace character count and alphabetical word ratio. Files with $< 50$ characters or $< 10$ meaningful words are flagged as scanned/empty images and rejected with an actionable error.
   - **Section Segmentation:** Normalizes and segments content into Skills, Experience, Education, Projects, and Certifications using regex headers.
   - **Experience & Education Heuristics:** Identifies date ranges (e.g., `2019 - 2023`, `Jan 2021 to Present`) and academic degree levels (B.Tech, MCA, M.S., Ph.D.).

2. **Skill Extraction & Taxonomy (`skill_extractor.py`):**
   - **Boundary Enforcement:** Regular expressions with `\b` word boundaries ensure exact token matching without substrings (e.g., `Java` does not trigger `JavaScript`, `C` does not trigger `C++`).
   - **Alias Resolution:** Standardizes synonyms (e.g., `postgres` $\rightarrow$ `postgresql`, `k8s` $\rightarrow$ `kubernetes`, `reactjs` $\rightarrow$ `react`).
   - **Two-Tier Matching:**
     - *Exact Match:* Candidate explicitly lists the required or preferred skill.
     - *Partial / Semantic Inferred Match:* Uses Sentence-BERT embedding cosine similarity above the threshold ($\tau = 0.70$) to detect related skills (e.g., `FastAPI` $\sim$ `Flask`).

3. **Sentence-BERT Semantic Matching (`embedding_service.py`):**
   - **Model:** `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional dense embeddings).
   - **Singleton Architecture:** Loaded once into memory on demand to prevent memory bloat.
   - **SHA-256 Embedding Cache:** Hashes input text strings to reuse precomputed vectors and eliminate redundant forward passes.
   - **Normalization:** Cosine similarity ($[-1, 1]$) is mapped to $[0, 100]$:
     $$\text{Score}_{\text{semantic}} = \max(0.0, \min(100.0, \cos(\mathbf{u}, \mathbf{v}) \times 100))$$

4. **Traditional Baselines (`traditional_matcher.py`):**
   - **Jaccard Token Overlap:**
     $$J(S_{\text{req}}, S_{\text{cand}}) = \frac{|S_{\text{req}} \cap S_{\text{cand}}|}{|S_{\text{req}} \cup S_{\text{cand}}|}$$
   - **TF-IDF Cosine Similarity:** Vectorizes job description and candidate resume using Scikit-Learn's `TfidfVectorizer` (sublinear TF scaling, English stop-words) and measures cosine angle.

---

## 3. Explainable Candidate Scoring Formula

The candidate composite score is calculated using the strict 6-component MCA research formula:

$$\text{Final Score} = 0.40 \times S_{\text{semantic}} + 0.25 \times S_{\text{req\_skills}} + 0.15 \times S_{\text{pref\_skills}} + 0.10 \times S_{\text{experience}} + 0.05 \times S_{\text{education}} + 0.05 \times S_{\text{certifications}}$$

| Component | Weight | Calculation & Normalization | Missing Data Handling |
| :--- | :---: | :--- | :--- |
| **Semantic Similarity** | $40\%$ | Sentence-BERT cosine similarity between Job Description & Resume text, scaled $[0, 100]$. | Returns $0\%$ if resume text is blank. |
| **Required Skills** | $25\%$ | $\frac{|\text{Matched}| + 0.5 \times |\text{Partial}|}{|\text{Total Required}|} \times 100$ | If no required skills specified by job, defaults to $100\%$. If candidate has none, $0\%$. |
| **Preferred Skills** | $15\%$ | $\frac{|\text{Matched}| + 0.5 \times |\text{Partial}|}{|\text{Total Preferred}|} \times 100$ | If no preferred skills specified by job, defaults to $100\%$. If candidate has none, $0\%$. |
| **Experience Match** | $10\%$ | $\min(100.0, \frac{\text{Candidate Exp Years}}{\text{Required Exp Years}} \times 100)$ | If candidate experience is undetected, defaults to $0.0\%$. |
| **Education Match** | $5\%$ | Degree level hierarchy mapping (PhD: 5, Master/MCA: 4, Bachelor/B.Tech: 3, Diploma: 2). | If undetected, defaults to $0.0\%$. |
| **Certifications** | $5\%$ | Percentage of job certifications detected in resume. | If no certifications required, defaults to $100\%$. If none found, $0\%$. |

### Decision Support Categories
- **High Match:** $\text{Final Score} \ge 75.0\%$
- **Medium Match:** $50.0\% \le \text{Final Score} < 75.0\%$
- **Low Match:** $\text{Final Score} < 50.0\%$

*(Note: Categories are provided purely for decision-support and recruiter triage; no automated hiring or rejection decisions are enforced.)*

---

## 4. Database Schema (SQLite via SQLAlchemy)

```
+--------------------+           +------------------------+
|       jobs         | 1       * |   screening_sessions   |
+--------------------+-----------+------------------------+
| id (PK, Integer)   |           | id (PK, Integer)       |
| title (String)     |           | job_id (FK -> jobs.id) |
| department (String)|           | session_name (String)  |
| description (Text) |           | status (String)        |
| min_experience     |           | total_resumes (Int)    |
| education_level    |           | created_at (DateTime)  |
| required_skills    |           +------------------------+
| preferred_skills   |                       | 1
| certifications     |                       |
| is_active (Bool)   |                       | *
| created_at         |           +------------------------+
+--------------------+           |   screening_results    |
          | 1                    +------------------------+
          |                      | id (PK, Integer)       |
          |                      | session_id (FK)        |
          |                      | candidate_id (FK)      |
          | *                    | final_score (Float)    |
+--------------------+           | match_category (String)|
|    candidates      |           | rank (Integer)         |
+--------------------+           | semantic_score (Float) |
| id (PK, Integer)   |           | required_skills_score  |
| job_id (FK)        |           | preferred_skills_score |
| candidate_code (UQ)|           | experience_score       |
| original_filename  |           | education_score        |
| stored_filename    |           | certification_score    |
| file_type, size    |           | jaccard_score          |
| extracted_text     |           | tfidf_score            |
| matched_skills     |           | strengths_summary      |
| missing_skills     |           | gaps_summary           |
| years_experience   |           | created_at (DateTime)  |
| education_level    |           +------------------------+
| created_at         |                       | *
+--------------------+                       | 1
                                 +------------------------+
                                 |  candidate (from left) |
                                 +------------------------+
```

---

## 5. Security, Ethics, and Privacy Protections

1. **Path Traversal Protection:** Filenames are sanitized via `werkzeug.utils.secure_filename` and prepended with cryptographically unique UUIDs. File paths are strictly validated to remain inside the designated `uploads/` directory.
2. **Payload Size Limits:** Flask `MAX_CONTENT_LENGTH` is enforced at $16\text{ MB}$, rejecting oversized attacks before file buffer consumption.
3. **No PII-Based Ranking:** The matching engine operates exclusively on qualification sections (skills, verified degree patterns, years of professional experience, and technical certifications). Demographic fields (name, gender, age, religion, ethnicity, photos) are intentionally omitted from scoring algorithms.
4. **Data Retention & Document Deletion:** Deleting a job or screening session cascades to delete records and physically unlinks uploaded resume files from the server disk.
