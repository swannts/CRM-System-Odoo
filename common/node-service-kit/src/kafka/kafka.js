import { Kafka, logLevel } from "kafkajs";

const DEFAULT_CLIENT_ID = "mymanager";

/**
 * @typedef {{
 *   clientId?: string;
 *   brokers?: string;
 *   logger?: { info?: Function; warn?: Function; error?: Function };
 * }} KafkaClientOptions
 */

/**
 * @typedef {{
 *   topic?: string;
 *   topics?: string[];
 *   groupId: string;
 *   fromBeginning?: boolean;
 *   onMessage: (message: {
 *     topic: string;
 *     key: string | null;
 *     payload: any;
 *     headers: Record<string, Buffer | undefined>;
 *     partition: number;
 *   }) => Promise<void>;
 * } & KafkaClientOptions} KafkaConsumerOptions
 */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseBrokers(brokers) {
  if (!brokers) {
    return ["localhost:9092"];
  }

  return String(brokers)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/** @param {KafkaClientOptions} options */
export function createKafkaClient({ clientId = DEFAULT_CLIENT_ID, brokers, logger }) {
  const parsedBrokers = parseBrokers(brokers);
  logger?.info?.({ brokers: parsedBrokers, clientId }, "Creating Kafka client");

  return new Kafka({
    clientId,
    brokers: parsedBrokers,
    logLevel: logLevel.NOTHING,
  });
}

/**
 * @param {KafkaClientOptions} options
 * @param {{ maxDelayMs?: number }} retryOptions
 */
export async function connectKafkaProducerWithRetry(
  { clientId = DEFAULT_CLIENT_ID, brokers, logger },
  { maxDelayMs = 10000 } = {}
) {
  const kafka = createKafkaClient({ clientId, brokers, logger });
  const producer = kafka.producer();
  let attempt = 0;

  while (true) {
    try {
      attempt += 1;
      await producer.connect();
      logger?.info?.({ clientId }, "Kafka producer connected");
      return producer;
    } catch (err) {
      const delayMs = Math.min(maxDelayMs, 500 + attempt * 500);
      logger?.warn?.({ err, attempt, delayMs }, "Kafka producer connect failed, retrying");
      await sleep(delayMs);
    }
  }
}

export async function publishJson(producer, topic, payload, key) {
  await producer.send({
    topic,
    messages: [
      {
        key: key ? String(key) : undefined,
        value: JSON.stringify(payload),
      },
    ],
  });
}

/** @param {KafkaConsumerOptions} options */
export async function startKafkaConsumer({
  clientId = DEFAULT_CLIENT_ID,
  brokers,
  groupId,
  topic = undefined,
  topics = undefined,
  logger,
  onMessage,
  fromBeginning = false,
}) {
  const kafka = createKafkaClient({ clientId, brokers, logger });
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();

  const subscriptionList = topics?.length ? topics : [topic];
  for (const subscription of subscriptionList) {
    await consumer.subscribe({ topic: subscription, fromBeginning });
  }

  await consumer.run({
    eachMessage: async ({ topic: receivedTopic, message, partition }) => {
      const rawValue = message.value?.toString() ?? "";
      try {
        const payload = rawValue ? JSON.parse(rawValue) : null;
        await onMessage({
          topic: receivedTopic,
          key: message.key?.toString() ?? null,
          payload,
          headers: message.headers ?? {},
          partition,
        });
      } catch (err) {
        logger?.error?.(
          { err, topic: receivedTopic, partition },
          "Kafka consumer failed to process message"
        );
        // Do not acknowledge failed writes; Kafka retries the uncommitted offset.
        throw err;
      }
    },
  });

  logger?.info?.({ topics: subscriptionList, groupId }, "Kafka consumer started");
  return consumer;
}
