const { getUsersForNewTask, updateUserNextTask } = require('../users');
const { getCourse } = require('../courses');
const { putMessage } = require('../messages');

module.exports = async event => {
  const users = (await getUsersForNewTask(Date.now())) || [];

  return await Promise.all(
    users.map(async user => {
      const currentCourse = user.courses && user.courses[0];

      if (currentCourse) {
        const course = await getCourse(currentCourse.id);

        if (course) {
          const item = course.items[currentCourse.pos];

          await updateUserNextTask({
            id: user.id,
            courses: [...user.courses.splice(1), { ...currentCourse, pos: currentCourse.pos + 1 }],
            nextTaskAt: Date.now() + 5 * 60 * 1000,
          });

          return putMessage({ chatId: user.chatId, text: item.text });
        }
      }
    }),
  );
};
