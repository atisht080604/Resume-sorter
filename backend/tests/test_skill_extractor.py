import pytest
from app.services.skill_extractor import SkillExtractor

def test_skill_extraction_boundaries():
    extractor = SkillExtractor()
    
    # Check that Java does not match in JavaScript
    text_js = "I have 3 years of experience in JavaScript and Node.js development."
    skills_js = extractor.extract_skills(text_js)
    assert 'JavaScript' in skills_js
    assert 'Node.js' in skills_js
    assert 'Java' not in skills_js

    # Check that Java matches when explicitly stated
    text_java = "Core Java developer with Spring Boot and MySQL expertise."
    skills_java = extractor.extract_skills(text_java)
    assert 'Java' in skills_java
    assert 'Spring Boot' in skills_java
    assert 'MySQL' in skills_java
    assert 'JavaScript' not in skills_java

def test_c_vs_cpp():
    extractor = SkillExtractor()
    text = "Proficient in C++ and Python."
    skills = extractor.extract_skills(text)
    assert 'C++' in skills
    assert 'Python' in skills
    assert 'C' not in skills

def test_alias_matching():
    extractor = SkillExtractor()
    # 'k8s' should map to Kubernetes
    text = "Orchestrated containers using k8s and docker-compose."
    skills = extractor.extract_skills(text)
    assert 'Kubernetes' in skills
    assert 'Docker' in skills
