# MCA Final Project Review & Viva Demonstration Guide

**Project Title:** AI-Powered Resume Screening System Using NLP and Semantic Similarity  
**Presentation Guide for MCA Final Examination / External Viva**

---

## 1. Quick Demonstration Checklist

| Time | Stage | Action to Perform | Key Point to Highlight |
| :---: | :--- | :--- | :--- |
| **0 - 2 min** | **Introduction & Architecture** | Open Home Dashboard | Explain local on-premise NLP architecture, privacy design, and no paid API dependency. |
| **2 - 4 min** | **Job Specification** | Create a "Senior Python & Full-Stack Engineer" job | Show structured skill tagging, experience requirement, and degree level. |
| **4 - 7 min** | **Resume Ingestion & Parsing** | Upload 6 resumes from `datasets/sample_resumes/` | Highlight multi-format support (PDF + DOCX) and automatic rejection of scanned/empty documents. |
| **7 - 10 min** | **Candidate Ranking & Explainability** | View ranked candidate list & candidate profile | Explain the 6-component research formula, radar chart, matched vs partial skills, and strengths/gaps. |
| **10 - 12 min** | **Candidate Comparison & Reports** | Side-by-side comparison & Download PDF/CSV report | Show professional recruiter decision support and audit trail. |
| **12 - 15 min** | **Scientific Benchmark & Viva Q&A** | Run Research Benchmark (IR metrics) & answer questions | Highlight Precision, Recall, F1, MRR, and NDCG@10 comparison with TF-IDF. |

---

## 2. Step-by-Step Viva Demonstration Walkthrough

### Step 1: Open the System
1. Launch the application (see `README.md` or execute `run_all.bat`).
2. Open your browser to `http://localhost:3000`.
3. Point out the clean recruiter dashboard showing real database statistics: Total Resumes Processed, Jobs Created, Screened Candidates, and Match Distribution.

### Step 2: Create a Realistic Job Requirement
1. Click **Jobs** in the sidebar $\rightarrow$ click **Create New Job**.
2. Fill in the following sample requirements:
   - **Job Title:** `Senior Python Full-Stack Engineer`
   - **Department:** `Software Engineering`
   - **Minimum Experience:** `3` years
   - **Education Level:** `Bachelor's / B.Tech / MCA`
   - **Required Skills:** `Python`, `Flask`, `React`, `SQL`, `REST APIs`
   - **Preferred Skills:** `Docker`, `PostgreSQL`, `Tailwind CSS`, `Git`
   - **Certifications:** `AWS Certified Developer`
   - **Job Description:**
     > Seeking an experienced Full-Stack Developer to design and maintain scalable web services. Must have strong Python backend experience with Flask or Django, interactive React frontend capabilities, and relational database expertise with SQL/PostgreSQL. Familiarity with containerization (Docker) and cloud deployments is preferred.
3. Click **Create Job**. The job is immediately persisted to the SQLite database.

### Step 3: Upload Resumes and Test Document Parsing
1. From the job row or the sidebar, navigate to **Screening** $\rightarrow$ select the newly created job.
2. Open the file explorer to `datasets/sample_resumes/` and select all 6 sample files:
   - `arjun_sharma_senior_python_dev.pdf` *(Strong match: Python, Flask, React, SQL, 5 years exp)*
   - `priya_nair_fullstack_dev.docx` *(High match: React, Node.js, Python, PostgreSQL, 4 years exp)*
   - `ananya_roy_lead_architect.docx` *(Senior match: Python, Django/Flask, Architecture, AWS, 8 years exp)*
   - `rohan_gupta_frontend_engineer.pdf` *(Partial match: React, Vue, CSS, but low backend experience)*
   - `vikas_patel_junior_dev.pdf` *(Junior match: 1 year exp, basic Python/HTML)*
   - `scanned_image_empty_resume.pdf` *(Scanned blank image without digital text)*
3. Click **Start Screening**.
4. **Viva Highlight Point:** Watch the parser immediately flag `scanned_image_empty_resume.pdf` with the message:
   > *"Document contains insufficient extractable text (likely a scanned image or empty document). Rejected for quality assurance."*
5. The remaining 5 valid documents proceed through Sentence-BERT embedding generation and the 6-component scoring formula.

### Step 4: Examine Explainable Candidate Ranking
1. The system redirects to the **Ranked Candidates** view.
2. Explain the ranking order:
   - Candidates are ranked in descending order of their composite score.
   - Match categories are clearly tagged: **High Match ($\ge 75\%$)**, **Medium Match ($50\% - 74\%$)**, and **Low Match ($< 50\%$)**.
3. Point out that each candidate row displays their **Composite Score**, **Semantic Similarity**, **Required Skills Match**, **Preferred Skills Match**, and detected experience.

### Step 5: Deep-Dive into Candidate Details
1. Click **View Details** on the top candidate (`Arjun Sharma`).
2. Show the viva committee:
   - **The 6-Component Radar Chart & Score Breakdown:** Visualizes exact weight contributions.
   - **Matched Skills vs Partial Skills:** Inferred skills using Sentence-BERT embeddings ($\ge 0.70$ threshold) are tagged distinctly from exact lexical matches.
   - **Missing Required Skills:** Clearly highlighted in red so recruiters instantly see gaps.
   - **Strengths & Gaps Explanation:** Generated deterministic explanation of why the candidate received their score without subjective bias.
   - **Extracted Text Inspector:** Recruiter can inspect the extracted resume text sections (Experience, Education, Skills).

### Step 6: Candidate Comparison
1. Go back to Candidate Results and click the **Compare** button on two candidates (e.g., `Arjun Sharma` and `Rohan Gupta`).
2. View the side-by-side comparison matrix showing score differentials, missing skills side by side, and experience delta.

### Step 7: Export Professional Reports
1. In the Candidate Results view, click **Export CSV** to download the tabular screening audit log.
2. Click **Export PDF** to generate a landscape executive report complete with candidate rankings, scores, and skill summaries formatted via ReportLab.

### Step 8: Research Benchmark (Scientific Integrity)
1. Navigate to **Research Benchmark** in the sidebar.
2. Click **Run Evaluation Benchmark**.
3. Show the real-time execution of the Information Retrieval benchmark across:
   - **Keyword / Jaccard Matching**
   - **TF-IDF Cosine Similarity**
   - **Sentence-BERT (`all-MiniLM-L6-v2`)**
4. Explain the resulting metrics: **Precision@3**, **Recall@3**, **F1@3**, **MRR**, and **NDCG@10**.
5. Emphasize that Sentence-BERT achieves superior NDCG@10 because contextual embeddings capture semantic equivalents (e.g., `FastAPI` $\approx$ `Flask`, `Postgres` $\approx$ `SQL`) that lexical approaches completely miss.

---

## 3. Anticipated Viva Questions & Model Answers

### Q1: Why did you choose Sentence-BERT (`all-MiniLM-L6-v2`) instead of standard Word2Vec or simple TF-IDF?
> **Answer:** Word2Vec produces static word representations without context, and TF-IDF relies strictly on lexical token overlap (exact bag-of-words). If a candidate writes *"Relational Database"* and the job requires *"SQL"*, TF-IDF gives zero similarity. Sentence-BERT generates contextual sentence embeddings trained using Siamese network structures, capturing semantic equivalence and thematic relevance across entire sentences. We selected `all-MiniLM-L6-v2` because it provides 384-dimensional dense vectors with state-of-the-art semantic accuracy while executing at $>10\times$ the speed of larger models, allowing it to run smoothly on standard CPU hardware without GPU acceleration.

### Q2: What is the exact research formula for candidate scoring?
> **Answer:** The final composite score uses a 6-component weighted formula:
> $$\text{Final Score} = 0.40 \times S_{\text{semantic}} + 0.25 \times S_{\text{req\_skills}} + 0.15 \times S_{\text{pref\_skills}} + 0.10 \times S_{\text{experience}} + 0.05 \times S_{\text{education}} + 0.05 \times S_{\text{certifications}}$$
> Each component is normalized to a $[0, 100]$ scale before applying weights. Missing information (e.g., undetected experience or education) receives a $0.0\%$ component score rather than artificially inflating the candidate's score.

### Q3: How do you handle non-standard resume formats and scanned images?
> **Answer:** We employ a two-stage document parser using PyMuPDF (`fitz`) for PDF documents and `python-docx` for Word documents. During extraction, we compute character density and alphabetical token ratio. If a document yields fewer than 50 characters or fewer than 10 valid words, the parser rejects the file as a scanned image or empty document and alerts the recruiter, rather than producing inaccurate screening results.

### Q4: How is ethical AI, privacy, and bias addressed in this system?
> **Answer:** The system strictly parses qualification-related sections: technical skills, years of verified experience, degree levels, and certifications. Demographic attributes such as candidate name, gender, age, photographs, religion, and location are excluded from the ranking algorithm. Furthermore, all processing runs locally on-premise; no candidate data is transmitted to third-party cloud APIs.
