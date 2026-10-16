from typing import Dict, Any, List

class CandidateScorer:
    """
    Computes explainable composite match scores using the research formula:
    Final Score = 0.40 * Semantic + 0.25 * ReqSkills + 0.15 * PrefSkills + 0.10 * Experience + 0.05 * Education + 0.05 * Certification
    """

    DEFAULT_WEIGHTS = {
        'semantic_similarity': 0.40,
        'required_skills': 0.25,
        'preferred_skills': 0.15,
        'experience': 0.10,
        'education': 0.05,
        'certification': 0.05
    }

    def __init__(self, weights: Dict[str, float] = None):
        self.weights = weights or self.DEFAULT_WEIGHTS.copy()
        self._validate_weights()

    def _validate_weights(self):
        total = sum(self.weights.values())
        if abs(total - 1.0) > 0.001:
            raise ValueError(f"Scoring weights must sum to 1.0, got {total}")

    def score_candidate(
        self,
        semantic_similarity_score: float,
        job_data: Dict[str, Any],
        candidate_data: Dict[str, Any],
        skills_match_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculates all 6 normalized components (0-100), composite final score,
        categorization, and detailed explainability breakdown.
        """
        # 1. Semantic Similarity Score (already 0-100)
        semantic_score = max(0.0, min(100.0, float(semantic_similarity_score)))

        # 2. Required Skills Score
        req_skills = job_data.get('required_skills') or []
        matched_req = skills_match_data.get('matched_required') or []
        partial_matches = skills_match_data.get('partial_matches') or []
        
        # Count partial matches for required skills at 50% credit
        partial_req_count = sum(1 for p in partial_matches if p.get('type') == 'required')

        if not req_skills:
            req_score = 100.0
            req_note = "Job specifies no required skills; full credit allocated."
        else:
            effective_matches = len(matched_req) + (partial_req_count * 0.5)
            req_score = min(100.0, (effective_matches / len(req_skills)) * 100.0)
            req_note = f"{len(matched_req)} of {len(req_skills)} required skills matched."
            if partial_req_count > 0:
                req_note += f" ({partial_req_count} partial matches credited at 50%)."

        # 3. Preferred Skills Score
        pref_skills = job_data.get('preferred_skills') or []
        matched_pref = skills_match_data.get('matched_preferred') or []
        partial_pref_count = sum(1 for p in partial_matches if p.get('type') == 'preferred')

        if not pref_skills:
            pref_score = 100.0
            pref_note = "No preferred skills specified in job description; full credit allocated."
        else:
            effective_pref = len(matched_pref) + (partial_pref_count * 0.5)
            pref_score = min(100.0, (effective_pref / len(pref_skills)) * 100.0)
            pref_note = f"{len(matched_pref)} of {len(pref_skills)} preferred skills matched."

        # 4. Experience Score
        min_exp = float(job_data.get('min_experience_years') or 0.0)
        cand_exp = float(candidate_data.get('experience_years') or 0.0)

        if min_exp <= 0.0:
            exp_score = 100.0
            exp_note = f"No minimum experience required (candidate has {cand_exp} years)."
        else:
            if cand_exp >= min_exp:
                exp_score = 100.0
                exp_note = f"Candidate meets or exceeds experience requirement ({cand_exp} yrs vs {min_exp} yrs required)."
            elif cand_exp > 0.0:
                exp_score = (cand_exp / min_exp) * 100.0
                exp_note = f"Partial experience ({cand_exp} yrs of {min_exp} yrs required)."
            else:
                exp_score = 0.0
                exp_note = f"No detectable experience found in resume ({min_exp} yrs required)."

        # 5. Education Score
        req_edu = job_data.get('education_requirements') or []
        cand_edu = candidate_data.get('education') or []

        if not req_edu:
            edu_score = 100.0
            edu_note = "No specific educational degree required."
        else:
            if not cand_edu:
                edu_score = 0.0
                edu_note = "No relevant educational degrees detected in resume."
            else:
                # Check for degree overlaps
                cand_edu_lower = [e.lower() for e in cand_edu]
                matched_edu = [
                    req for req in req_edu
                    if any(req.lower() in cand or cand in req.lower() for cand in cand_edu_lower)
                ]
                if matched_edu:
                    edu_score = 100.0
                    edu_note = f"Required degree matched: {', '.join(matched_edu)}."
                else:
                    edu_score = 50.0  # Higher education detected but differs from target
                    edu_note = f"Candidate has degree ({', '.join(cand_edu)}), but may differ from preferred ({', '.join(req_edu)})."

        # 6. Certification Score
        req_certs = job_data.get('certifications') or []
        cand_certs = candidate_data.get('certifications') or []

        if not req_certs:
            cert_score = 100.0
            cert_note = "No professional certifications required."
        else:
            if not cand_certs:
                cert_score = 0.0
                cert_note = "No certifications detected in resume."
            else:
                cand_certs_lower = [c.lower() for c in cand_certs]
                matched_certs = [
                    rc for rc in req_certs
                    if any(rc.lower() in cc or cc in rc.lower() for cc in cand_certs_lower)
                ]
                cert_score = (len(matched_certs) / len(req_certs)) * 100.0
                cert_note = f"{len(matched_certs)} of {len(req_certs)} certifications matched."

        # Compute Contributions & Composite Score
        contrib_semantic = self.weights['semantic_similarity'] * semantic_score
        contrib_req_skills = self.weights['required_skills'] * req_score
        contrib_pref_skills = self.weights['preferred_skills'] * pref_score
        contrib_exp = self.weights['experience'] * exp_score
        contrib_edu = self.weights['education'] * edu_score
        contrib_cert = self.weights['certification'] * cert_score

        composite_score = round(
            contrib_semantic + contrib_req_skills + contrib_pref_skills +
            contrib_exp + contrib_edu + contrib_cert,
            2
        )

        # Categorization
        if composite_score >= 75.0:
            category = "High Match"
        elif composite_score >= 50.0:
            category = "Medium Match"
        else:
            category = "Low Match"

        # Generate Strengths & Gaps Explainability
        strengths = []
        gaps = []

        if semantic_score >= 70.0:
            strengths.append(f"Strong semantic alignment with job description ({round(semantic_score, 1)}%).")
        elif semantic_score < 40.0:
            gaps.append(f"Low semantic similarity with job description ({round(semantic_score, 1)}%).")

        if req_score >= 80.0:
            strengths.append(f"High required skills coverage ({len(matched_req)} skills found).")
        else:
            missing_req = skills_match_data.get('missing_required') or []
            if missing_req:
                gaps.append(f"Missing required skills: {', '.join(missing_req[:5])}.")

        if exp_score >= 100.0 and min_exp > 0:
            strengths.append(f"Meets or exceeds required experience ({cand_exp} years).")
        elif exp_score < 70.0 and min_exp > 0:
            gaps.append(f"Experience shortfall ({cand_exp} yrs vs {min_exp} yrs required).")

        if edu_score >= 100.0 and req_edu:
            strengths.append("Educational qualifications meet criteria.")
        elif edu_score < 60.0 and req_edu:
            gaps.append("Target educational degree requirements not verified.")

        explanation = {
            'summary': f"Candidate scored {composite_score}% ({category}).",
            'strengths': strengths,
            'gaps': gaps,
            'notes': {
                'semantic': f"Semantic similarity: {round(semantic_score, 1)}%.",
                'required_skills': req_note,
                'preferred_skills': pref_note,
                'experience': exp_note,
                'education': edu_note,
                'certification': cert_note
            },
            'contributions': {
                'semantic_similarity': round(contrib_semantic, 2),
                'required_skills': round(contrib_req_skills, 2),
                'preferred_skills': round(contrib_pref_skills, 2),
                'experience': round(contrib_exp, 2),
                'education': round(contrib_edu, 2),
                'certification': round(contrib_cert, 2)
            },
            'weights_applied': self.weights
        }

        return {
            'composite_score': composite_score,
            'match_category': category,
            'component_scores': {
                'semantic_similarity': round(semantic_score, 2),
                'required_skills': round(req_score, 2),
                'preferred_skills': round(pref_score, 2),
                'experience': round(exp_score, 2),
                'education': round(edu_score, 2),
                'certification': round(cert_score, 2)
            },
            'explanation': explanation
        }
