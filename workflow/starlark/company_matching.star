def match_company(skill_score, company_demand, availability, quota):
    if quota <= 0:
        return {
            "match": False,
            "score": 0
        }

    score = (skill_score * 50 / 100) + (company_demand * 30 / 100) + (availability * 20 / 100)

    match = False
    if score >= 70:
        match = True

    return {
        "match": match,
        "score": score
    }