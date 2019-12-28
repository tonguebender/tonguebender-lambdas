const { getUsersForNewTask } = require('../users');
const { executeNextTask } = require('../tasks');

module.exports = async event => {
  const users = (await getUsersForNewTask(Date.now())) || [];

  return await Promise.all(
    users.map(user => {
      return executeNextTask(user);
    }),
  );
};
