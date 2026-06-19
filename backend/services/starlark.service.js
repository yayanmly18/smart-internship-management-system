exports.calculateFinalScore = (data) => {
    const attendance = data.attendance || 0;
    const weekly_report = data.weekly_report || 0;
    const supervisor_score = data.supervisor_score || 0;
    const company_score = data.company_score || 0;

    const finalScore =
        (attendance * 0.2) +
        (weekly_report * 0.3) +
        (supervisor_score * 0.2) +
        (company_score * 0.3);

    let grade = "D";

    if (finalScore >= 85) grade = "A";
    else if (finalScore >= 75) grade = "B";
    else if (finalScore >= 60) grade = "C";

    return {
        final_score: Number(finalScore.toFixed(2)),
        grade: grade
    };
};