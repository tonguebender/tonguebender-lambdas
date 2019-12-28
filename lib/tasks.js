const { updateUserTasks } = require('./users');
const { getCourse } = require('./courses');
const { putMessage } = require('./messages');

const executeNextTask = async user => {
  const currentTask = user.tasks && user.tasks[0];

  if (currentTask && currentTask.type === 'course') {
    const course = await getCourse(currentTask.id);

    if (course) {
      const item = course.items[currentTask.pos];

      await updateUserTasks({
        id: user.id,
        tasks: [...user.tasks.splice(1), { ...currentTask, pos: currentTask.pos + 1 }],
      });

      return putMessage({ chatId: user.chatId, text: item.text });
    }
  }
};

module.exports = {
  executeNextTask,
};
