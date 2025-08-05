const { Kafka } = require('kafkajs');
const eventStore = require('../../models/event');
require('dotenv').config();

const kafka = new Kafka({
  clientId: 'inventory-event-publisher',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();

class InventoryEventPublisher {
  async publish(event) {
    try {
      // 이벤트 저장
      await eventStore.saveEvent(event);

      // Kafka로 이벤트 발행
      await producer.connect();
      await producer.send({
        topic: 'inventory-events',
        messages: [
          { value: JSON.stringify(event) }
        ]
      });
    } catch (error) {
      console.error('Error publishing event:', error);
      throw error;
    } finally {
      await producer.disconnect();
    }
  }

  async publishInventoryCreated(data) {
    await this.publish({
      type: 'INVENTORY_CREATED',
      data
    });
  }

  async publishInventoryUpdated(data) {
    await this.publish({
      type: 'INVENTORY_UPDATED',
      data
    });
  }

  async publishInventoryDeleted(id) {
    await this.publish({
      type: 'INVENTORY_DELETED',
      data: { id }
    });
  }
}

module.exports = new InventoryEventPublisher(); 