const AWS = require('aws-sdk');

const IS_OFFLINE = process.env.IS_OFFLINE;

AWS.config.update({ region: 'eu-west-2' });
AWS.config.setPromisesDependency(Promise);

const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

const QUEUE_URL = 'https://sqs.eu-west-2.amazonaws.com/035313854880/short-delay-tasks';

const putTask = ({ userId, data = {} }) => {
  if (IS_OFFLINE) {
    console.log(`TASK to ${userId}`);
    return Promise.resolve();
  }

  return sqs
    .sendMessage({
      MessageAttributes: {},
      MessageBody: JSON.stringify(
        {
          userId,
          data,
        },
        null,
        '',
      ),
      QueueUrl: QUEUE_URL,
    })
    .promise();
};

module.exports = {
  putTask,
};
