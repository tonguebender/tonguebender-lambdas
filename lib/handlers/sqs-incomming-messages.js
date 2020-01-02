const { createUser, getUser, updateUserTasks } = require('../users');
const { getQuizzes } = require('../quizzes');
const { executeNextTask } = require('../tasks');
const { putMessage } = require('../messages');
const { putTask } = require('../short-delay-tasks');

const IS_OFFLINE = process.env.IS_OFFLINE;

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

module.exports = async (event) => {
  await Promise.all(
    event.Records.map(async (msg) => {
      const data = JSON.parse(msg.body);
      const { text = '', chatId } = data;

      if (IS_OFFLINE) {
        console.log(`MESSAGE from ${chatId}: ${text}`);
      }

      const message = text.toLowerCase();
      let response = '';

      if (message === '/start') {
        const from = (data.data && data.data.message && data.data.message.from) || {};
        const name = from.first_name || from.last_name || from.username;
        response = `Hi ${name}`;

        await createUser({
          chatId,
          name,
        });
      } else if (message === 'hi') {
        response = 'Hi';
      } else if (message === 'next') {
        const user = await getUser(`telegram_${chatId}`);

        await putTask({ userId: user.id });
      } else if (message === 'quiz') {
        const user = await getUser(`telegram_${chatId}`);
        const quizzes = await getQuizzes();

        await updateUserTasks({
          id: user.id,
          tasks: [
            {
              type: 'quiz',
              id: quizzes[0].id,
            },
            ...user.tasks,
          ],
        });

        await putTask({ userId: user.id });
      } else {
        const user = await getUser(`telegram_${chatId}`);
        const currentTask = user.tasks && user.tasks[0];
        const type = currentTask && currentTask.type;

        if (type === 'quiz') {
          await executeNextTask(user, message);
        } else {
          response = `sqs echo: ${text}`;
        }
      }

      if (response) {
        return putMessage({
          chatId,
          text: response,
          data,
        });
      }
    }),
  );

  return {
    statusCode: 200,
    body: ``,
  };
};
