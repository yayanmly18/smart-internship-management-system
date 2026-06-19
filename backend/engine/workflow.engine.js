const vflowClient = require("../integrations/vflow.client");
const natsService = require("../services/nats.service");

exports.triggerWorkflow = async (workflowName, payload) => {
    try {
        // trigger ke VFlow server
        const result = await vflowClient.trigger({
            workflow: workflowName,
            data: payload
        });

        // publish event ke NATS
        await natsService.publish("WorkflowTriggered", {
            workflow: workflowName,
            payload
        });

        return result;

    } catch (error) {
        throw new Error("Workflow Engine Error: " + error.message);
    }
};