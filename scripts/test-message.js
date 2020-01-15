const axios = require('axios');

const HOST = 'http://localhost:3000';
const SEND_MSG_PATH = '/v2/functions/tongue-bender-dev-sqsIncomingMessages/invocations';
const SQS_ACTION_PATH = '/v2/functions/tongue-bender-dev-sqsActions/invocations';
const OUTGOING_MSG_PATH = '/v2/functions/tongue-bender-dev-sqsOutgoingMessages/invocations';
const NEXT_TASK_PATH = '/v2/functions/tongue-bender-dev-sqsShortDelayTasks/invocations';
const TICK_PATH = '/v2/functions/tongue-bender-dev-tick/invocations';

const getMessage = (text) => ({
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
    text,
  },
});

const sendMessage = (text) => {
  console.log('SEND:', text);

  return axios.post(`${HOST}${SQS_ACTION_PATH}`, {
    Records: [
      {
        body: JSON.stringify({
          type: 'REPLY_TO',
          chatId: 126498435,
          data: getMessage(text),
        }),
      },
    ],
  });
};

const sendTelegramMessage = (text, buttons) => {
  console.log('Telegram:', text);

  return axios.post(`${HOST}${OUTGOING_MSG_PATH}`, {
    Records: [
      {
        body: JSON.stringify({
          chatId: 126498435,
          text,
          data: {
            buttons,
          },
        }),
      },
    ],
  });
};

const nextTask = () => {
  console.log('NEXT_TASK');

  return axios.post(`${HOST}${SQS_ACTION_PATH}`, {
    Records: [
      {
        body: JSON.stringify({
          type: 'NEXT',
          chatId: 126498435,
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

  // sendTelegramMessage('qwe', ['next', 'blah'] );

  await sendMessage('/start');

  // await nextTask();
  // await nextTask();
  // await nextTask();
  // await nextTask();

  await sendMessage('quiz');
  await nextTask();
  await nextTask();
  await nextTask();
  await sendMessage('4');
  await nextTask();
  await sendMessage('E');
  await nextTask();
  await nextTask();
  await nextTask();
  await nextTask();
  await nextTask();
  await sendMessage('define anus');
}

test();
