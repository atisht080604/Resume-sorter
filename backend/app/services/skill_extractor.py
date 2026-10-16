import re
from typing import List, Dict, Set, Tuple, Any

class SkillExtractor:
    """
    Skill extraction module with a categorized ontology,
    phrase-level boundary matching, alias resolution, and exact vs inferred matching.
    """

    DEFAULT_SKILL_TAXONOMY: Dict[str, Dict[str, List[str]]] = {
        'Languages': {
            'Python': ['python', 'python3', 'py'],
            'Java': ['java', 'core java', 'java 8', 'java 11', 'java 17'],
            'JavaScript': ['javascript', 'js', 'es6', 'ecmascript'],
            'TypeScript': ['typescript', 'ts'],
            'C++': ['c++', 'cpp'],
            'C#': ['c#', 'csharp', '.net c#'],
            'C': ['c language', 'ansi c'],
            'Go': ['golang', 'go language'],
            'Rust': ['rust', 'rustlang'],
            'PHP': ['php', 'php7', 'php8'],
            'Ruby': ['ruby', 'ruby on rails'],
            'Swift': ['swift', 'swiftui'],
            'Kotlin': ['kotlin'],
            'Scala': ['scala'],
            'R': ['r programming', 'r language'],
            'SQL': ['sql', 't-sql', 'pl/sql', 'structured query language'],
            'HTML': ['html', 'html5'],
            'CSS': ['css', 'css3', 'scss', 'sass'],
            'Bash/Shell': ['bash', 'shell script', 'shell scripting', 'powershell', 'zsh'],
        },
        'Frameworks & Libraries': {
            'React': ['react', 'react.js', 'reactjs'],
            'Angular': ['angular', 'angularjs', 'angular 2+'],
            'Vue.js': ['vue', 'vue.js', 'vuejs'],
            'Next.js': ['next.js', 'nextjs'],
            'Node.js': ['node', 'node.js', 'nodejs'],
            'Express.js': ['express', 'express.js', 'expressjs'],
            'Flask': ['flask'],
            'Django': ['django', 'django rest framework', 'drf'],
            'FastAPI': ['fastapi'],
            'Spring Boot': ['spring boot', 'spring framework', 'spring mvc'],
            'ASP.NET': ['asp.net', 'asp.net core', '.net core'],
            'Tailwind CSS': ['tailwind', 'tailwind css', 'tailwindcss'],
            'Bootstrap': ['bootstrap', 'bootstrap 5'],
        },
        'Databases': {
            'PostgreSQL': ['postgresql', 'postgres', 'psql'],
            'MySQL': ['mysql'],
            'MongoDB': ['mongodb', 'mongo'],
            'Redis': ['redis'],
            'SQLite': ['sqlite', 'sqlite3'],
            'Oracle': ['oracle db', 'oracle database', 'plsql'],
            'Cassandra': ['cassandra', 'apache cassandra'],
            'Elasticsearch': ['elasticsearch', 'elastic search', 'elk stack'],
            'DynamoDB': ['dynamodb', 'aws dynamodb'],
            'Firebase': ['firebase', 'firestore'],
        },
        'Cloud & DevOps': {
            'AWS': ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'ecs', 'cloudformation'],
            'Azure': ['azure', 'microsoft azure', 'azure devops'],
            'Google Cloud': ['gcp', 'google cloud', 'google cloud platform'],
            'Docker': ['docker', 'containerization', 'docker compose'],
            'Kubernetes': ['kubernetes', 'k8s', 'helm'],
            'Terraform': ['terraform'],
            'CI/CD': ['ci/cd', 'continuous integration', 'continuous delivery', 'github actions', 'jenkins', 'gitlab ci'],
            'Linux': ['linux', 'ubuntu', 'centos', 'redhat', 'debian', 'unix'],
            'Git': ['git', 'github', 'gitlab', 'version control'],
            'Nginx': ['nginx'],
        },
        'AI & Machine Learning': {
            'Machine Learning': ['machine learning', 'ml', 'supervised learning', 'unsupervised learning'],
            'Deep Learning': ['deep learning', 'neural networks', 'ann', 'cnn', 'rnn', 'lstm'],
            'NLP': ['nlp', 'natural language processing', 'text mining', 'named entity recognition', 'sentiment analysis'],
            'Computer Vision': ['computer vision', 'opencv', 'image processing'],
            'PyTorch': ['pytorch'],
            'TensorFlow': ['tensorflow', 'tf', 'keras'],
            'Scikit-learn': ['scikit-learn', 'sklearn'],
            'Sentence Transformers': ['sentence-transformers', 'sentence transformers', 'sbert', 'sentence bert'],
            'Hugging Face': ['hugging face', 'huggingface', 'transformers'],
            'Large Language Models': ['llm', 'llms', 'large language models', 'langchain', 'rag', 'retrieval-augmented generation'],
            'Pandas': ['pandas'],
            'NumPy': ['numpy'],
            'Data Science': ['data science', 'data analytics', 'data analysis', 'eda'],
        },
        'Architecture & Concepts': {
            'REST APIs': ['rest api', 'rest apis', 'restful api', 'restful web services', 'rest'],
            'GraphQL': ['graphql'],
            'Microservices': ['microservices', 'microservice architecture'],
            'System Design': ['system design', 'distributed systems', 'scalability'],
            'Agile': ['agile', 'scrum', 'kanban', 'sprint'],
            'Unit Testing': ['unit testing', 'pytest', 'jest', 'test-driven development', 'tdd'],
        }
    }

    # Pre-compile exact skill lookup map
    def __init__(self, custom_taxonomy: Dict = None):
        self.taxonomy = custom_taxonomy or self.DEFAULT_SKILL_TAXONOMY
        self._build_lookup_index()

    def _build_lookup_index(self):
        """Builds normalized regex patterns with precise boundary rules."""
        self.skill_patterns = []  # (compiled_regex, canonical_name, category)
        self.canonical_skills = set()

        # Sort longer aliases first to avoid greedy shorter prefix conflicts (e.g. JavaScript before Java)
        all_entries = []
        for category, skill_map in self.taxonomy.items():
            for canonical, aliases in skill_map.items():
                self.canonical_skills.add(canonical)
                # Include canonical name as an alias
                full_aliases = set(aliases + [canonical.lower()])
                for alias in full_aliases:
                    all_entries.append((len(alias), alias.strip().lower(), canonical, category))

        # Sort descending by length of alias
        all_entries.sort(key=lambda x: x[0], reverse=True)

        for _, alias, canonical, category in all_entries:
            # Handle special symbols like C++, C#, .NET
            escaped = re.escape(alias)
            
            # Special case for pure single letters or tricky phrases
            if alias in ['c', 'r']:
                # Require explicit context like 'c/c++', 'c language', ' r language'
                pattern = rf'(?:\b|(?<=[^a-zA-Z0-9]))(?:{escaped}\s*(?:language|programming)|(?:ansi\s+)?{escaped}(?=[,/;\s]+(?:c\+\+|cpp|java)))(?:\b|(?=[^a-zA-Z0-9]))'
            elif alias in ['go']:
                pattern = rf'\b(?:golang|go\s+language)\b'
            elif alias.endswith('++') or alias.endswith('#'):
                pattern = rf'\b{escaped}(?:\b|(?=[^a-zA-Z0-9]))'
            else:
                pattern = rf'\b{escaped}\b'

            try:
                compiled = re.compile(pattern, re.IGNORECASE)
                self.skill_patterns.append((compiled, canonical, category))
            except re.error:
                continue

    def extract_skills(self, text: str) -> List[str]:
        """
        Extracts matched canonical skills from text without false positives.
        Preserves complete skill phrase context (e.g. Java vs JavaScript).
        """
        if not text:
            return []

        found_skills = {}
        # Work on lowercase text but evaluate compiled patterns
        text_lower = text.lower()

        # Specifically track detected indices to prevent substring collision
        matched_spans = []

        for pattern, canonical, category in self.skill_patterns:
            for match in pattern.finditer(text_lower):
                start, end = match.span()
                # Check overlap with already accepted spans
                overlap = False
                for s, e in matched_spans:
                    if not (end <= s or start >= e):
                        overlap = True
                        break
                if not overlap:
                    matched_spans.append((start, end))
                    if canonical not in found_skills:
                        found_skills[canonical] = category

        # Return unique canonical skills sorted alphabetically
        return sorted(list(found_skills.keys()))

    def match_skills(
        self,
        required_skills: List[str],
        preferred_skills: List[str],
        candidate_skills: List[str],
        semantic_model=None,
        semantic_threshold: float = 0.70
    ) -> Dict[str, Any]:
        """
        Compares job required/preferred skills against candidate skills.
        Distinguishes:
        - Exact matches
        - Partial / inferred semantic matches (>= threshold)
        - Missing skills
        """
        candidate_set = {s.lower() for s in candidate_skills}
        
        # 1. Match Required Skills
        matched_required = []
        missing_required = []
        partial_matches = []

        for req in required_skills:
            req_clean = req.strip()
            if req_clean.lower() in candidate_set or self._find_alias_match(req_clean, candidate_skills):
                matched_required.append(req_clean)
            else:
                # Check semantic/inferred similarity if semantic model provided
                inferred_match = self._find_semantic_match(
                    req_clean, candidate_skills, semantic_model, semantic_threshold
                )
                if inferred_match:
                    partial_matches.append({
                        'job_skill': req_clean,
                        'candidate_skill': inferred_match['candidate_skill'],
                        'similarity': inferred_match['similarity'],
                        'type': 'required'
                    })
                else:
                    missing_required.append(req_clean)

        # 2. Match Preferred Skills
        matched_preferred = []
        missing_preferred = []

        for pref in preferred_skills:
            pref_clean = pref.strip()
            if pref_clean.lower() in candidate_set or self._find_alias_match(pref_clean, candidate_skills):
                matched_preferred.append(pref_clean)
            else:
                inferred_match = self._find_semantic_match(
                    pref_clean, candidate_skills, semantic_model, semantic_threshold
                )
                if inferred_match:
                    partial_matches.append({
                        'job_skill': pref_clean,
                        'candidate_skill': inferred_match['candidate_skill'],
                        'similarity': inferred_match['similarity'],
                        'type': 'preferred'
                    })
                else:
                    missing_preferred.append(pref_clean)

        return {
            'matched_required': matched_required,
            'matched_preferred': matched_preferred,
            'partial_matches': partial_matches,
            'missing_required': missing_required,
            'missing_preferred': missing_preferred
        }

    def _find_alias_match(self, skill: str, candidate_skills: List[str]) -> bool:
        """Checks if any candidate skill matches an alias of this skill."""
        skill_lower = skill.lower()
        for cat, group in self.taxonomy.items():
            for canonical, aliases in group.items():
                all_names = [canonical.lower()] + [a.lower() for a in aliases]
                if skill_lower in all_names:
                    # If this is the group, see if any candidate skill is also in this group
                    for cand in candidate_skills:
                        if cand.lower() in all_names:
                            return True
        return False

    def _find_semantic_match(
        self,
        job_skill: str,
        candidate_skills: List[str],
        semantic_model,
        threshold: float
    ) -> Dict[str, Any] | None:
        """Finds closest candidate skill using Sentence-BERT embeddings."""
        if not semantic_model or not candidate_skills:
            return None

        best_cand = None
        best_sim = 0.0

        for cand_skill in candidate_skills:
            try:
                sim = semantic_model.calculate_similarity(job_skill, cand_skill)
                if sim >= threshold and sim > best_sim:
                    best_sim = sim
                    best_cand = cand_skill
            except Exception:
                continue

        if best_cand and best_sim >= threshold:
            return {
                'candidate_skill': best_cand,
                'similarity': round(best_sim, 3)
            }
        return None
