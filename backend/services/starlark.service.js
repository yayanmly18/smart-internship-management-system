exports.calculateEligibility = (data) => {
    const gpa = data.gpa || 0;
    const semester = data.semester || 0;
    const certificate_count = data.certificate_count || 0;
    const organization_exp = data.organization_exp || 0;

    let score = 0;

    if (gpa >= 3.5) score += 40;
    else if (gpa >= 3.0) score += 25;

    if (semester >= 5) score += 20;

    score += certificate_count * 5;
    score += organization_exp * 3;

    return {
        score,
        eligible: score >= 60
    };
};