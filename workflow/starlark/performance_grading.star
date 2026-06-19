def calculate_final_score(attendance, weekly_report, supervisor_score, company_score):
    final_score = (
        attendance * 0.2 +
        weekly_report * 0.3 +
        supervisor_score * 0.2 +
        company_score * 0.3
    )

    grade = "D"

    if final_score >= 85:
        grade = "A"
    elif final_score >= 75:
        grade = "B"
    elif final_score >= 60:
        grade = "C"

    return {
        "final_score": final_score,
        "grade": grade
    }