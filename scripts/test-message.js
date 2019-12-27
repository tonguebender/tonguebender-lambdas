const axios = require('axios');

const HOST = 'http://localhost:3000';
const PATH = '/v2/functions/tongue-bender-dev-sqsIncomingMessages/invocations';

const text = '/start';

const message = {
  agent: 'telegram',
  chatId: 126498435,
  text,
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
};

async function test() {
  console.log('SEND:', text);

  await axios.post(`${HOST}${PATH}`, {
    Records: [
      {
        body: JSON.stringify(message),
      },
    ],
  });
}

test();
