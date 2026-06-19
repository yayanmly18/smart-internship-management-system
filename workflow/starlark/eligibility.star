def calculate_eligibility(gpa, semester, certificate_count, organization_exp):
    score = 0

    if gpa >= 3.5:
        score = score + 40
    elif gpa >= 3.0:
        score = score + 25

    if semester >= 5:
        score = score + 20

    score = score + (certificate_count * 5)
    score = score + (organization_exp * 3)

    eligible = False
    if score >= 60:
        eligible = True

    return {
        "score": score,
        "eligible": eligible
    }