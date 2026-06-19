exports.trigger = async ({ workflow, data }) => {
    return {
        workflow,
        status: "executed",
        data
    };
};