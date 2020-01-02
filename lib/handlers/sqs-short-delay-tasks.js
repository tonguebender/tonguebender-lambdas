const { getUser } = require('../users');
const { executeNextTask } = require('../tasks');

module.exports = async (event) => {
  await Promise.all(
    event.Records.map(async (msg) => {
      const data = JSON.parse(msg.body);
      const user = await getUser(data.userId);

      await executeNextTask(user);
    }),
  );
};
