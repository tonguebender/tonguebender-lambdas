const { updateUserTasks } = require('./users');
const { getCourse } = require('./courses');
const { getQuiz } = require('./quizzes');
const { putMessage } = require('./messages');
const { putTask } = require('./short-delay-tasks');

const TASKS = {
  START_COURSE: 'START_COURSE',
  COURSE_ITEM: 'COURSE_ITEM',
  STOP_COURSE: 'STOP_COURSE',
  START_QUIZ: 'START_QUIZ',
  QUIZ_ITEM: 'QUIZ_ITEM',
  QUIZ_CHECK_ANSWER: 'QUIZ_CHECK_ANSWER',
  STOP_QUIZ: 'STOP_QUIZ',
};

const executeNextTask = async (user, message) => {
  const currentTask = user.tasks && user.tasks[0];
  const taskType = currentTask && currentTask.type;

  switch (taskType) {
    case TASKS.START_COURSE: {
      const course = await getCourse(currentTask.courseId);
      const response = `Started course: ${course.title}`;

      await updateUserTasks({
        id: user.id,
        tasks: [
          {
            type: TASKS.COURSE_ITEM,
            courseId: currentTask.courseId,
            pos: 0,
          },
          ...user.tasks.splice(1),
        ],
      });

      return putMessage({ chatId: user.chatId, text: response });
    }
    case TASKS.COURSE_ITEM: {
      const course = await getCourse(currentTask.courseId);
      const item = course.items[currentTask.pos];
      const hasMore = course.items.length > currentTask.pos + 1;

      if (hasMore) {
        await updateUserTasks({
          id: user.id,
          tasks: [
            ...user.tasks.splice(1),
            {
              type: TASKS.COURSE_ITEM,
              courseId: currentTask.courseId,
              pos: currentTask.pos + 1,
            },
          ],
        });
      } else {
        await updateUserTasks({
          id: user.id,
          tasks: [
            {
              type: TASKS.STOP_COURSE,
              courseId: currentTask.courseId,
            },
            ...user.tasks.splice(1),
          ],
        });

        await putTask({ userId: user.id });
      }

      return putMessage({ chatId: user.chatId, text: item.text });
    }
    case TASKS.STOP_COURSE: {
      const course = await getCourse(currentTask.courseId);
      const response = `Finished course: ${course.title}`;

      await updateUserTasks({
        id: user.id,
        tasks: [...user.tasks.splice(1)],
      });

      return putMessage({ chatId: user.chatId, text: response });
    }
    case TASKS.START_QUIZ: {
      const quiz = await getQuiz(currentTask.quizId);
      const response = `Started quiz: ${quiz.title}`;

      await updateUserTasks({
        id: user.id,
        tasks: [
          {
            type: TASKS.QUIZ_ITEM,
            quizId: currentTask.quizId,
            quizItems: [...quiz.items, { type: 'show-results' }],
            correct: 0,
            incorrect: 0,
          },
          ...user.tasks.splice(1),
        ],
      });

      await putTask({ userId: user.id });

      return putMessage({ chatId: user.chatId, text: response });
    }
    case TASKS.STOP_QUIZ: {
      const quiz = await getQuiz(currentTask.quizId);
      const response = `Stopped quiz: ${quiz.title}`;

      await updateUserTasks({
        id: user.id,
        tasks: [...user.tasks.splice(1)],
      });

      return putMessage({ chatId: user.chatId, text: response });
    }
    case TASKS.QUIZ_ITEM: {
      const currentItem = currentTask.quizItems[0];
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
              quizId: currentTask.quizId,
              quizItems: currentTask.quizItems,
              correct: currentTask.correct,
              incorrect: currentTask.incorrect,
            },
            ...user.tasks.splice(1),
          ],
        });
      } else if (currentItem.type === 'show-results') {
        let { correct = 0, incorrect = 0 } = currentTask;
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
              quizId: currentTask.quizId,
              quizItems: [...currentTask.quizItems.splice(1)],
              correct: currentTask.correct,
              incorrect: currentTask.incorrect,
            },
            ...user.tasks.splice(1),
          ],
        });

        await putTask({ userId: user.id });
      }

      return putMessage({ chatId: user.chatId, text: response, data: { buttons } });
    }
    case TASKS.QUIZ_CHECK_ANSWER: {
      const currentQuestion = currentTask.quizItems[0];
      let { correct = 0, incorrect = 0 } = currentTask;
      let response;

      if (message) {
        if (currentQuestion.answers.some((i) => i.toLowerCase() === message)) {
          response = `👍`;
          correct++;
        } else {
          response = `👎\n\nAnswer: ${currentQuestion.answers.join(', ')}`;
          incorrect++;
        }
      } else {
        response = `Answer: ${currentQuestion.answers.join(', ')}`;
        incorrect++;
      }

      await updateUserTasks({
        id: user.id,
        tasks: [
          {
            type: TASKS.QUIZ_ITEM,
            quizId: currentTask.quizId,
            quizItems: [...currentTask.quizItems.splice(1)],
            correct,
            incorrect,
          },
          ...user.tasks.splice(1),
        ],
      });

      await putTask({ userId: user.id });

      return putMessage({ chatId: user.chatId, text: response });
    }
    default: {
      console.log('UNKNOWN TASK', currentTask);
    }
  }
};

module.exports = {
  TASKS,
  executeNextTask,
};
