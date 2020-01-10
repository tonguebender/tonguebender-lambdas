import * as AWS from 'aws-sdk';
import { IOutgoingMessage } from './handlers/sqs-outgoing-messages';

const IS_OFFLINE = process.env.IS_OFFLINE;

AWS.config.update({ region: 'eu-west-2' });
AWS.config.setPromisesDependency(Promise);

const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

const OUTGOING_MESSAGES_QUEUE_URL = 'https://sqs.eu-west-2.amazonaws.com/035313854880/outgoing-messages.fifo';

export const putMessage = ({ chatId, text, data = {} }: IOutgoingMessage) => {
  if (!chatId || !text) return;

  if (IS_OFFLINE) {
    console.log(`MESSAGE to ${chatId}: ${text}`);
    return Promise.resolve();
  }

  return sqs
    .sendMessage({
      MessageGroupId: 'telegram',
      MessageDeduplicationId: `${Date.now()}:${Math.random()}`,
      MessageAttributes: {},
      MessageBody: JSON.stringify(
        {
          agent: 'telegram',
          chatId,
          text,
          data,
        },
        null,
        '',
      ),
      QueueUrl: OUTGOING_MESSAGES_QUEUE_URL,
    })
    .promise();
};
