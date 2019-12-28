const AWS = require('aws-sdk');

const IS_OFFLINE = process.env.IS_OFFLINE;

AWS.config.update({ region: 'eu-west-2' });
AWS.config.setPromisesDependency(Promise);

const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

const OUTGOING_MESSAGES_QUEUE_URL = 'https://sqs.eu-west-2.amazonaws.com/035313854880/outgoing-messages';

const putMessage = ({ chatId, text, data = {} }) => {
  if (IS_OFFLINE) return Promise.resolve();

  return sqs
    .sendMessage({
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

module.exports = {
  putMessage,
};
