import * as AWS from 'aws-sdk';
import { createUser, getUser, updateUserTasks } from './users';
import { putMessage } from './messages';
import { getQuizzes } from './quizzes';
import { getCourses } from './courses';
import { getDefinition, getIrregularForms } from './tongues';
import { executeNextTask, IQuizTask, IUserTask, TASKS } from './tasks';
import { convertMessageToAction } from './handlers/hook-telegram';

AWS.config.update({ region: 'eu-west-2' });
AWS.config.setPromisesDependency(Promise);

const IS_OFFLINE = process.env.IS_OFFLINE;

// todo: read from ssm
const ACTIONS_QUEUE_URL = 'https://sqs.eu-west-2.amazonaws.com/035313854880/actions.fifo';

const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

type ValueOf<T> = T[keyof T];

export interface IAction {
  type: ValueOf<ACTIONS>;
  chatId: number;
  data?: any;
}

export enum ACTIONS {
  START = 'START',
  SAY_HI = 'SAY_HI',
  NEXT = 'NEXT',
  START_QUIZ = 'START_QUIZ',
  REPLY_TO = 'REPLY_TO',
  DEFINE = 'DEFINE',
  SYNONYMS = 'SYNONYMS',
  IPA = 'IPA',
  IRREGULAR_FORMS = 'IRREGULAR_FORMS',
  STOP = 'STOP',
  COURSES = 'COURSES',
  SUBSCRIBE = 'SUBSCRIBE',
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

export const putAction = async (action: IAction, delayMs = 1000) => {
  if (IS_OFFLINE) {
    console.log(`ACTION ${action.type} to ${action.chatId}`);
    return Promise.resolve();
  }

  await delay(delayMs);

  return sqs
    .sendMessage({
      MessageGroupId: 'actions',
      MessageDeduplicationId: `${Date.now()}:${Math.random()}`,
      MessageAttributes: {},
      MessageBody: JSON.stringify(action),
      QueueUrl: ACTIONS_QUEUE_URL,
    })
    .promise();
};

export const processAction = async (action: IAction): Promise<any> => {
  const { type } = action;

  switch (type) {
    case ACTIONS.START: {
      const { chatId, data } = action;
      const from = data?.message?.from || {};
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
    case ACTIONS.COURSES: {
      const { chatId } = action;
      const user = await getUser(`telegram_${chatId}`);
      const courses = await getCourses();
      const data = courses.reduce((res, c, i) => ({ ...res, [i + 1]: c.id }), {});
      const response = `Courses:\n${courses
        .map((c, i) => `${i + 1}. ${c.title}`)
        .join('\n')}\nWhich course do you want to subscribe to?`;

      await updateUserTasks({
        id: user.id,
        tasks: [
          {
            type: TASKS.SUBSCRIBE_TO_COURSE,
            data,
          },
          ...user.tasks,
        ],
      });

      return putMessage({
        chatId,
        text: response,
        data: {
          buttons: Object.keys(data),
        },
      });
    }
    case ACTIONS.SUBSCRIBE: {
      const { chatId } = action;
      const courses = await getCourses();
      const response = `Courses:\n${courses.map((c, i) => `${i + 1}. ${c.title}`).join('\n')}`;

      return putMessage({
        chatId,
        text: response,
      });
    }
    case ACTIONS.NEXT: {
      const { chatId } = action;
      const user = await getUser(`telegram_${chatId}`);

      return await executeNextTask(user);
    }
    case ACTIONS.STOP: {
      const { chatId } = action;
      const user = await getUser(`telegram_${chatId}`);
      const currentTask: IUserTask = user.tasks[0];

      if (currentTask.type === TASKS.QUIZ_ITEM || currentTask.type === TASKS.QUIZ_CHECK_ANSWER) {
        await updateUserTasks({
          id: user.id,
          tasks: [
            {
              type: TASKS.STOP_QUIZ,
              quizId: (currentTask as IQuizTask).quizId,
            },
            ...user.tasks.splice(1),
          ],
        });

        return putAction({ type: ACTIONS.NEXT, chatId });
      } else if (currentTask.type === TASKS.COURSE_ITEM) {
        // todo
      }

      return;
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

      return putAction({ type: ACTIONS.NEXT, chatId });
    }
    case ACTIONS.DEFINE: {
      const { chatId, data } = action;
      const def = await getDefinition(data.word);
      let response;

      if (def && def.def) {
        response = `*${def.pk}* _[${def.ipa}]_\n${def.def
          .map((d) => `- (${d.speech_part}) ${d.def}${d.example ? `\n_${d.example}_` : ''}`)
          .join('\n')}`;
      } else {
        response = 'Not found';
      }

      return putMessage({
        chatId,
        text: response,
      });
    }
    case ACTIONS.SYNONYMS: {
      const { chatId, data } = action;
      const def = await getDefinition(data.word);
      let response;

      if (def && def.def) {
        response = `*${def.pk}*${def.ipa ? ` _[${def.ipa}]_` : ''}\n${def.def
          .map((d) => (d.synonyms || []).join(', '))
          .filter((s) => s.length)
          .join(';\n')}`;
      } else {
        response = 'Not found';
      }

      return putMessage({
        chatId,
        text: response,
      });
    }
    case ACTIONS.IPA: {
      const { chatId, data } = action;
      const def = await getDefinition(data.word);
      let response;

      if (def && def.ipa) {
        response = `*${def.pk}* _[${def.ipa}]_`;
      } else {
        response = 'Not found';
      }

      return putMessage({
        chatId,
        text: response,
      });
    }
    case ACTIONS.IRREGULAR_FORMS: {
      const { chatId, data } = action;
      const def = await getIrregularForms(data.word);
      let response;

      if (def) {
        response = `*${def.pk}* ${def.pastSimple} ${def.pastParticiple} ${def.comment ? `\n_${def.comment}_` : ''}`;
      } else {
        response = 'Not found';
      }

      return putMessage({
        chatId,
        text: response,
      });
    }
    case ACTIONS.REPLY_TO: {
      const { chatId, data } = action;

      const newAction: IAction = convertMessageToAction(data);

      if (newAction.type !== ACTIONS.REPLY_TO) {
        return processAction(newAction);
      } else {
        const user = await getUser(`telegram_${chatId}`);

        const currentTask = user?.tasks[0];
        const type = currentTask?.type;

        if (type === TASKS.QUIZ_CHECK_ANSWER || type === TASKS.SUBSCRIBE_TO_COURSE) {
          return await executeNextTask(user, data.message.text);
        }

        return putMessage({
          chatId,
          text: 'I do not know how to help with that.',
        });
      }
    }
    default:
      console.log('Unknown action', action);
  }
};
