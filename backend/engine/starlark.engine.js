exports.executeEligibility = (data) => {
    const { gpa, semester, certificate_count, organization_exp } = data;

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

exports.executeMatching = (skill, demand, availability) => {
    const score =
        (skill * 0.5) +
        (demand * 0.3) +
        (availability * 0.2);

    return {
        match_score: score,
        matched: score >= 70
    };
};

exports.executeGrading = (attendance, report, supervisor, company) => {
    const finalScore =
        (attendance * 0.2) +
        (report * 0.3) +
        (supervisor * 0.2) +
        (company * 0.3);

    let grade = "D";

    if (finalScore >= 85) grade = "A";
    else if (finalScore >= 75) grade = "B";
    else if (finalScore >= 60) grade = "C";

    return {
        final_score: finalScore,
        grade
    };
};