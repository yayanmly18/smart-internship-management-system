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

    # 1. Tarik data dari payload event
input_skill = float(ctx.payload.skill_score)
input_demand = float(ctx.payload.company_demand)
input_avail = float(ctx.payload.availability)
input_quota = int(ctx.payload.quota)

# 2. Eksekusi fungsi lu
result = match_company(input_skill, input_demand, input_avail, input_quota)

# 3. Set output buat workflow selanjutnya
ctx.output.is_match = result["match"]
ctx.output.match_score = result["score"]