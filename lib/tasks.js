const { updateUserTasks } = require('./users');
const { getCourse } = require('./courses');
const { getQuiz } = require('./quizzes');
const { putMessage } = require('./messages');
const { putTask } = require('./short-delay-tasks');

const executeNextTask = async (user, message) => {
  const currentTask = user.tasks && user.tasks[0];
  const type = currentTask && currentTask.type;

  if (type === 'course') {
    const course = await getCourse(currentTask.id);

    if (course) {
      const item = course.items[currentTask.pos || 0];
      const hasMore = course.items.length >= currentTask.pos + 1;
      const tasks = hasMore
        ? [
            ...user.tasks.splice(1),
            {
              ...currentTask,
              pos: currentTask.pos + 1,
            },
          ]
        : user.tasks.splice(1);

      await updateUserTasks({
        id: user.id,
        tasks,
      });

      return putMessage({ chatId: user.chatId, text: item && item.text });
    }
  } else if (type === 'quiz') {
    let { items, data = { correct: 0, incorrect: 0 } } = currentTask;
    let response = '';
    let buttons;

    if (!items) {
      const quiz = await getQuiz(currentTask.id);
      items = [...((quiz && quiz.items) || []), { type: 'end-quiz' }];
    }

    if (items.length) {
      const currentItem = items[0] || {};

      // do nothing if message sent at a wrong stage
      if (message && currentItem.type !== 'check-answer') return;

      switch (currentItem.type) {
        case 'question':
          response = currentItem.text;

          buttons = currentItem.options;

          items = [
            {
              ...currentItem,
              type: 'check-answer',
            },
            ...items.splice(1),
          ];

          break;
        case 'check-answer':
          if (message) {
            if (currentItem.answers.some((i) => i.toLowerCase() === message)) {
              response = `👍`;
              data.correct = data.correct ? data.correct + 1 : 1;
            } else {
              response = `👎\n\nAnswer: ${currentItem.answers.join(', ')}`;
              data.incorrect = data.incorrect ? data.incorrect + 1 : 1;
            }
          } else {
            response = `Answer: ${currentItem.answers.join(', ')}`;
            data.incorrect = data.incorrect ? data.incorrect + 1 : 1;
          }

          items = [...items.splice(1)];

          await putTask({ userId: user.id });

          break;
        case 'end-quiz':
          response = `Result: ${data.correct}/${data.correct + data.incorrect}`;

          items = [];

          break;
        default:
          response = currentItem.text;

          items = [...items.splice(1)];

          await putTask({ userId: user.id });

          break;
      }
    }

    await updateUserTasks({
      id: user.id,
      tasks: items.length
        ? [
            {
              ...currentTask,
              data,
              items,
            },
            ...user.tasks.splice(1),
          ]
        : user.tasks.splice(1),
    });

    await putMessage({ chatId: user.chatId, text: response, data: { buttons } });
  }
};

module.exports = {
  executeNextTask,
};
