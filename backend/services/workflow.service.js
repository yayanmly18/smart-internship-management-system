exports.trigger = async (name, payload) => {
    return {
        workflow: name,
        status: "triggered",
        payload
    };
};

exports.list = async () => {
    return ["wf_registration", "wf_eligibility", "wf_approval"];
};