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

# 1. Tarik data dari payload event
input_att = float(ctx.payload.attendance)
input_weekly = float(ctx.payload.weekly_report)
input_spv = float(ctx.payload.supervisor_score)
input_comp = float(ctx.payload.company_score)

# 2. Eksekusi fungsi lu
result = calculate_final_score(input_att, input_weekly, input_spv, input_comp)

# 3. Set output buat workflow selanjutnya
ctx.output.final_score = result["final_score"]
ctx.output.grade = result["grade"]