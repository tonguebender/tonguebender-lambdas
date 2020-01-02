const axios = require('axios');

const HOST = 'http://localhost:3000';
const SEND_MSG_PATH = '/v2/functions/tongue-bender-dev-sqsIncomingMessages/invocations';
const NEXT_TASK_PATH = '/v2/functions/tongue-bender-dev-sqsShortDelayTasks/invocations';
const TICK_PATH = '/v2/functions/tongue-bender-dev-tick/invocations';

const getMessage = (text) => ({
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
});

const sendMessage = (text) => {
  console.log('SEND:', text);

  return axios.post(`${HOST}${SEND_MSG_PATH}`, {
    Records: [
      {
        body: JSON.stringify(getMessage(text)),
      },
    ],
  });
};

const nextTask = () => {
  console.log('NEXT_TASK');

  return axios.post(`${HOST}${NEXT_TASK_PATH}`, {
    Records: [
      {
        body: JSON.stringify({
          userId: 'telegram_126498435',
        }),
      },
    ],
  });
};

const tick = () => {
  console.log('TICK');

  return axios.post(`${HOST}${TICK_PATH}`, {});
};

async function test() {
  console.log('START');

  await sendMessage('/start');
  await nextTask();
  await sendMessage('quiz');
  await nextTask();
  await nextTask();
  await sendMessage('4');
  await nextTask();
  await sendMessage('E');
  await nextTask();
  await nextTask();
}

test();
