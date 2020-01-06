import { SQSEvent, SQSRecord } from 'aws-lambda';
import { putMessage } from '../messages';
import { getQuizzes } from '../quizzes';
import { putTask } from '../short-delay-tasks';
import { createUser, getUser, updateUserTasks } from '../users';

const { TASKS, executeNextTask } = require('../tasks');

const IS_OFFLINE = process.env.IS_OFFLINE;

type ValueOf<T> = T[keyof T];

interface IMessage {
  agent: string;
  chatId: number;
  text: string;
  data: {
    update_id: number;
    message: {
      message_id: number;
      from: {
        id: number;
        is_bot: boolean;
        first_name: string;
        last_name: string;
        username: string;
        language_code: string;
      };
      chat: { id: number; first_name: string; last_name: string; username: string; type: string };
      date: number;
      text: string;
    };
  };
}

interface IAction {
  type: ValueOf<ACTIONS>;
  chatId: number;
  message?: string;
  messageData?: any;
}

enum ACTIONS {
  START = 'START',
  SAY_HI = 'SAY_HI',
  NEXT = 'NEXT',
  START_QUIZ = 'START_QUIZ',
  REPLY_TO = 'REPLY_TO',

  // todo
  STOP = 'STOP',
  DEFINE = 'DEFINE',
  SYNONYMS = 'SYNONYMS',
  IPA = 'IPA',
}

const processAction = async (action: IAction): Promise<any> => {
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

const convertMessageToAction = ({ text = '', chatId, data }: IMessage): IAction => {
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

export default async (event: SQSEvent) => {
  await Promise.all(
    event.Records.map(async (msg: SQSRecord) => {
      const data: IMessage = JSON.parse(msg.body);

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
