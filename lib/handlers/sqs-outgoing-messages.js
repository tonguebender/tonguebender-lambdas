const Telegraf = require('telegraf');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

/*
Message:

{
"chatId":126498435,
"text":"blah",
}
 */

module.exports = async (event, context) => {
  await Promise.all(
    event.Records.map(async (msg) => {
      const data = JSON.parse(msg.body);
      let res;
      try {
        res = bot.telegram.sendMessage(data.chatId, data.text, { parse_mode: 'Markdown' });
      } catch (e) {
        console.log(e);
      }
      return res;
    }),
  );

  return {
    statusCode: 200,
    body: ``,
  };
};
