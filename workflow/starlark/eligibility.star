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


# 1. Tarik data dari payload event yang dikirim Frontend
input_gpa = float(ctx.payload.gpa)
input_semester = int(ctx.payload.semester)
input_cert = int(ctx.payload.certificate_count)
input_org = int(ctx.payload.organization_exp)

# 2. Eksekusi fungsi yang udah lu bikin
result = calculate_eligibility(input_gpa, input_semester, input_cert, input_org)

# 3. Set hasil ke output VFlow biar step selanjutnya (atau VRule) bisa baca
ctx.output.score = result["score"]
ctx.output.is_eligible = result["eligible"]