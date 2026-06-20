const vruleClient = require("../integrations/vrule.client");

exports.evaluate = async (ruleId, input) => {
    try {
        const result = await vruleClient.execute({
            rule: ruleId,
            input: input
        });

        return {
            ruleId,
            result,
            passed: result?.status === "PASS" || result?.eligible === true
        };

    } catch (error) {
        throw new Error("VRule Engine Error: " + error.message);
    }
};