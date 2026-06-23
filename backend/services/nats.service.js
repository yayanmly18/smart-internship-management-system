const db = require("../integrations/database.client");

/**
 * NATS Event Simulation - Publish events to internal log
 * In production, this would connect to a real NATS server
 */
exports.publish = async (eventName, payload) => {
  try {
    const result = await db.run(
      'INSERT INTO events (event_name, payload) VALUES (?,?)',
      [eventName, JSON.stringify(payload)]
    );
    console.log(`[NATS] Event published: ${eventName} (id: ${result.id})`);
    return { event: eventName, id: result.id, published: true };
  } catch (err) {
    console.error(`[NATS] Failed to publish ${eventName}:`, err);
    return { event: eventName, published: false, error: err.message };
  }
};

/**
 * Subscribe to events (for future expansion)
 */
exports.subscribe = (eventName, callback) => {
  console.log(`[NATS] Subscribed to ${eventName} (simulated)`);
  // In production, this would register a NATS subscription
};