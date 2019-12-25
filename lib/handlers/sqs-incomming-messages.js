const AWS = require('aws-sdk');

AWS.config.update({ region: 'eu-west-2' });
AWS.config.setPromisesDependency(Promise);

const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

const OUTGOING_MESSAGES_QUEUE_URL = 'https://sqs.eu-west-2.amazonaws.com/035313854880/outgoing-messages';

/*
Message:

{
"agent":"telegram",
"chatId":126498435,
"text":"blah",
"data":{
"update_id":399068016,
"message":{"message_id":4871,"from":{"id":126498435,"is_bot":false,"first_name":"Sergey","last_name":"Maximov","username":"dosyara","language_code":"en"},
"chat":{"id":126498435,"first_name":"Sergey","last_name":"Maximov","username":"dosyara","type":"private"},
"date":1577294713,
"text":"blah"}}
}
 */

module.exports = async (event, context) => {
  await Promise.all(
    event.Records.map(async msg => {
      const data = JSON.parse(msg.body);
      const { text, chatId } = data;
      let response = '';

      if (text === 'hi') {
        response = 'Hi';
      } else {
        response = `sqs echo: ${text}`;
      }

      return await sqs
        .sendMessage({
          MessageAttributes: {},
          MessageBody: JSON.stringify(
            {
              agent: 'telegram',
              chatId,
              text: response,
              data,
            },
            null,
            '',
          ),
          QueueUrl: OUTGOING_MESSAGES_QUEUE_URL,
        })
        .promise();
    }),
  );

  return {
    statusCode: 200,
    body: ``,
  };
};
