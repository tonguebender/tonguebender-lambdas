const AWS = require('aws-sdk');
const Telegraf = require('telegraf');

AWS.config.update({ region: 'eu-west-2' });
AWS.config.setPromisesDependency(Promise);

// todo: read from ssm
const INCOMING_MESSAGES_QUEUE_URL = 'https://sqs.eu-west-2.amazonaws.com/035313854880/incoming-messages';

const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.on('text', ctx => ctx.reply(`hook echo: ${ctx.message.text}`));

module.exports = async (event, context) => {
  if (event.body) {
    try {
      const update = JSON.parse(event.body);

      await sqs
        .sendMessage({
          MessageAttributes: {},
          MessageBody: JSON.stringify(
            {
              agent: 'telegram',
              chatId: update.message.chat.id,
              text: update.message.text,
              data: update,
            },
            null,
            '',
          ),
          QueueUrl: INCOMING_MESSAGES_QUEUE_URL,
        })
        .promise();

      await bot.handleUpdate(update);
    } catch (e) {
      console.log(e);
    }
  }

  return {
    statusCode: 200,
    body: ``,
  };
};
