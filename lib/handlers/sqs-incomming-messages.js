const Telegraf = require('telegraf');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

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
      console.log(data);
      return bot.telegram.sendMessage(data.chatId, `sqs echo: ${data.text}`, { parse_mode: 'Markdown' });
    }),
  );

  return {
    statusCode: 200,
    body: ``,
  };
};
