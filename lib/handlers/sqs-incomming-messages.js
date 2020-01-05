const { createUser, getUser, updateUserTasks } = require('../users');
const { getQuizzes } = require('../quizzes');
const { TASKS, executeNextTask } = require('../tasks');
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

const ACTIONS = {
  START: 'START',
  SAY_HI: 'SAY_HI',
  NEXT: 'NEXT',
  START_QUIZ: 'START_QUIZ',
  REPLY_TO: 'REPLY_TO',

  // todo:
  STOP: 'STOP',
  DEFINE: 'DEFINE',
  SYNONYMS: 'SYNONYMS',
  IPA: 'IPA',
};

const processAction = async (action = {}) => {
  const { type } = action;

  switch (type) {
    case ACTIONS.START: {
      const { chatId, messageData } = action;
      const from = (messageData.message && messageData.message.from) || {};
      const name = from.first_name || from.last_name || from.username || 'user';
      const response = `Hi ${name}`;

      await createUser({
        chatId,
        name,
      });

      return putMessage({
        chatId,
        text: response,
      });
    }
    case ACTIONS.SAY_HI: {
      const { chatId } = action;
      const response = `Hi!`;

      return putMessage({
        chatId,
        text: response,
      });
    }
    case ACTIONS.NEXT: {
      const { chatId } = action;
      const user = await getUser(`telegram_${chatId}`);

      return await putTask({ userId: user.id });
    }
    case ACTIONS.START_QUIZ: {
      const { chatId } = action;
      const user = await getUser(`telegram_${chatId}`);
      const quizzes = await getQuizzes();
      const quiz = quizzes[0];

      await updateUserTasks({
        id: user.id,
        tasks: [
          {
            type: TASKS.START_QUIZ,
            quizId: quiz.id,
          },
          ...user.tasks,
        ],
      });

      return putTask({ userId: user.id });
    }
    case ACTIONS.REPLY_TO: {
      const { chatId, message } = action;
      const user = await getUser(`telegram_${chatId}`);
      const currentTask = user.tasks && user.tasks[0];
      const type = currentTask && currentTask.type;

      if (type === TASKS.QUIZ_CHECK_ANSWER) {
        return await executeNextTask(user, message);
      }

      return putMessage({
        chatId,
        text: 'I do not know how to help with that',
      });
    }
    default:
      console.log('Unknown action', action);
  }
};

const convertMessageToAction = ({ text = '', chatId, data }) => {
  const message = text.toLowerCase().trim();

  switch (message) {
    case '/start':
      return {
        type: ACTIONS.START,
        chatId,
        messageData: data,
      };
    case 'hi':
      return {
        type: ACTIONS.SAY_HI,
        chatId,
      };
    case 'next':
      return {
        type: ACTIONS.NEXT,
        chatId,
      };
    case 'quiz':
      return {
        type: ACTIONS.START_QUIZ,
        chatId,
      };
    default:
      return {
        type: ACTIONS.REPLY_TO,
        chatId,
        message,
      };
  }
};

module.exports = async (event) => {
  await Promise.all(
    event.Records.map(async (msg) => {
      const data = JSON.parse(msg.body);

      if (IS_OFFLINE) {
        console.log(`MESSAGE from ${data.chatId}: ${data.text}`);
      }

      return processAction(convertMessageToAction(data));
    }),
  );

  return {
    statusCode: 200,
    body: ``,
  };
};
