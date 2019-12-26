const putMessage = require('../put-message');
const { createUser } = require('../users');

/*
Message:

{
  agent: 'telegram',
  chatId: 126498435,
  text: 'blah',
  data: {
    update_id: 399068016,
    message: {
      message_id: 4871,
      from: {
        id: 126498435,
        is_bot: false,
        first_name: 'Sergey',
        last_name: 'Maximov',
        username: 'dosyara',
        language_code: 'en',
      },
      chat: { id: 126498435, first_name: 'Sergey', last_name: 'Maximov', username: 'dosyara', type: 'private' },
      date: 1577294713,
      text: 'blah',
    },
  },
}
 */

module.exports = async (event, context) => {
  await Promise.all(
    event.Records.map(async msg => {
      const data = JSON.parse(msg.body);
      console.log(data);
      const { text, chatId } = data;
      let response = '';

      if (text === 'hi') {
        response = 'Hi';
      } else if (text === '/start') {
        const from = (data.data && data.data.message && data.data.message.from) || {};
        const name = from.first_name || from.last_name || from.username;
        response = `Hi ${name}`;

        await createUser({
          chatId,
          name,
        });
      } else {
        response = `sqs echo: ${text}`;
      }

      return putMessage({
        chatId,
        text: response,
        data,
      });
    }),
  );

  return {
    statusCode: 200,
    body: ``,
  };
};
