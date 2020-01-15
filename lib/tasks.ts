import { updateUserTasks, User } from './users';
import { getCourse } from './courses';
import { getQuiz, IQuizItem } from './quizzes';
import { putMessage } from './messages';
import { ACTIONS, putAction } from './actions';

export interface ITask {
  type: string;
}
export interface ICourseTask extends ITask {
  type: TASKS.COURSE_ITEM | TASKS.START_COURSE | TASKS.STOP_COURSE;
  courseId: string;
  pos: number;
}
export interface IQuizTask extends ITask {
  type: TASKS.START_QUIZ | TASKS.QUIZ_ITEM | TASKS.QUIZ_CHECK_ANSWER | TASKS.STOP_QUIZ;
  quizId: string;
  quizItems: IQuizItem[];
  correct: number;
  incorrect: number;
}
export type IUserTask = ICourseTask | IQuizTask | ITask;

export enum TASKS {
  START_COURSE = 'START_COURSE',
  COURSE_ITEM = 'COURSE_ITEM',
  STOP_COURSE = 'STOP_COURSE',
  START_QUIZ = 'START_QUIZ',
  QUIZ_ITEM = 'QUIZ_ITEM',
  QUIZ_CHECK_ANSWER = 'QUIZ_CHECK_ANSWER',
  STOP_QUIZ = 'STOP_QUIZ',
}

export const executeNextTask = async (user: User, message?: string) => {
  const currentTask: IUserTask = user.tasks[0];
  const taskType = currentTask?.type;
  const { chatId } = user;

  switch (taskType) {
    case TASKS.START_COURSE: {
      const { courseId } = currentTask as ICourseTask;
      const course = await getCourse(courseId);
      const response = `Started course: ${course.title}`;

      await updateUserTasks({
        id: user.id,
        tasks: [
          {
            type: TASKS.COURSE_ITEM,
            courseId: (currentTask as ICourseTask).courseId,
            pos: 0,
          },
          ...user.tasks.splice(1),
        ],
      });

      return putMessage({ chatId, text: response });
    }
    case TASKS.COURSE_ITEM: {
      const { courseId, pos } = currentTask as ICourseTask;
      const course = await getCourse(courseId);
      const item = course.items[pos];
      const hasMore = course.items.length > pos + 1;

      if (hasMore) {
        await updateUserTasks({
          id: user.id,
          tasks: [
            ...user.tasks.splice(1),
            {
              type: TASKS.COURSE_ITEM,
              courseId: courseId,
              pos: pos + 1,
            },
          ],
        });
      } else {
        await updateUserTasks({
          id: user.id,
          tasks: [
            {
              type: TASKS.STOP_COURSE,
              courseId: courseId,
            },
            ...user.tasks.splice(1),
          ],
        });

        await putAction({ type: ACTIONS.NEXT, chatId });
      }

      return putMessage({ chatId, text: item.text });
    }
    case TASKS.STOP_COURSE: {
      const { courseId } = currentTask as ICourseTask;
      const course = await getCourse(courseId);
      const response = `Finished course: ${course.title}`;

      await updateUserTasks({
        id: user.id,
        tasks: [...user.tasks.splice(1)],
      });

      return putMessage({ chatId, text: response });
    }
    case TASKS.START_QUIZ: {
      const { quizId } = currentTask as IQuizTask;
      const quiz = await getQuiz(quizId);
      const response = `Started quiz: ${quiz.title}`;

      await updateUserTasks({
        id: user.id,
        tasks: [
          {
            type: TASKS.QUIZ_ITEM,
            quizId: quizId,
            quizItems: [...quiz.items, { type: 'show-results' }],
            correct: 0,
            incorrect: 0,
          },
          ...user.tasks.splice(1),
        ],
      });

      await putAction({ type: ACTIONS.NEXT, chatId });

      return putMessage({ chatId, text: response });
    }
    case TASKS.STOP_QUIZ: {
      const { quizId } = currentTask as IQuizTask;
      const quiz = await getQuiz(quizId);
      const response = `Stopped quiz: ${quiz.title}`;

      await updateUserTasks({
        id: user.id,
        tasks: [...user.tasks.splice(1)],
      });

      return putMessage({ chatId, text: response });
    }
    case TASKS.QUIZ_ITEM: {
      const { quizId, quizItems, correct, incorrect } = currentTask as IQuizTask;
      const currentItem = quizItems[0];
      let response;
      let buttons;

      if (currentItem.type === 'question') {
        response = currentItem.text;

        buttons = currentItem.options;

        await updateUserTasks({
          id: user.id,
          tasks: [
            {
              type: TASKS.QUIZ_CHECK_ANSWER,
              quizId,
              quizItems,
              correct,
              incorrect,
            },
            ...user.tasks.splice(1),
          ],
        });
      } else if (currentItem.type === 'show-results') {
        const { correct = 0, incorrect = 0 } = currentTask as IQuizTask;
        response = `Result: ${correct}/${correct + incorrect}`;

        await updateUserTasks({
          id: user.id,
          tasks: [...user.tasks.splice(1)],
        });
      } else {
        response = currentItem.text;

        await updateUserTasks({
          id: user.id,
          tasks: [
            {
              type: TASKS.QUIZ_ITEM,
              quizId: quizId,
              quizItems: [...quizItems.splice(1)],
              correct: correct,
              incorrect: incorrect,
            },
            ...user.tasks.splice(1),
          ],
        });

        await putAction({ type: ACTIONS.NEXT, chatId });
      }

      return putMessage({ chatId, text: response || '', data: { buttons } });
    }
    case TASKS.QUIZ_CHECK_ANSWER: {
      const { quizId, quizItems } = currentTask as IQuizTask;
      const currentQuestion = quizItems[0];
      let { correct = 0, incorrect = 0 } = currentTask as IQuizTask;
      let response;

      if (message) {
        if (currentQuestion.answers?.some((i) => i.toLowerCase() === message)) {
          response = `👍`;
          correct++;
        } else {
          response = `👎\n\nAnswer: ${currentQuestion.answers?.join(', ')}`;
          incorrect++;
        }
      } else {
        response = `Answer: ${currentQuestion.answers?.join(', ')}`;
        incorrect++;
      }

      await updateUserTasks({
        id: user.id,
        tasks: [
          {
            type: TASKS.QUIZ_ITEM,
            quizId: quizId,
            quizItems: [...quizItems.splice(1)],
            correct,
            incorrect,
          },
          ...user.tasks.splice(1),
        ],
      });

      await putAction({ type: ACTIONS.NEXT, chatId });

      return putMessage({ chatId, text: response });
    }
    default: {
      console.log('UNKNOWN TASK', currentTask);
    }
  }
};
