def generate_certificate(final_score, attendance):
    eligible = False
    status = "REJECTED"

    if final_score >= 75:
        if attendance >= 80:
            eligible = True
            status = "APPROVED"

    return {
        "eligible": eligible,
        "status": status
    }