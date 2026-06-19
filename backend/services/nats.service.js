let messages = [];

exports.publish = async (topic, data) => {
    messages.push({ topic, data });
    console.log("NATS EVENT:", topic, data);
};