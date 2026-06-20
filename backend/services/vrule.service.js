exports.evaluate = async (ruleId, data) => {
    if (ruleId === "vrule_eligibility_check") {
        return {
            passed: data.eligible === true ? true : false
        };
    }

    if (ruleId === "vrule_performance_grading") {
        return {
            passed: data.score >= 75
        };
    }

    return { passed: false };
};