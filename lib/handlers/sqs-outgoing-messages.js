const Telegraf = require('telegraf');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

/*
Message:

{
"chatId":126498435,
"text":"blah",
"data": {}
}
 */

module.exports = async (event, context) => {
  await Promise.all(
    event.Records.map(async (msg) => {
      const data = JSON.parse(msg.body);
      let res;
      try {
        res = bot.telegram.sendMessage(data.chatId, data.text, {
          parse_mode: 'Markdown',
          reply_markup:
            data.data && data.data.buttons
              ? { keyboard: [data.data.buttons.map((b) => ({ text: b }))], one_time_keyboard: true }
              : { remove_keyboard: true },
        });
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
