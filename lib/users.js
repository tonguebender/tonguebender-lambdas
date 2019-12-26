const AWS = require('aws-sdk');

AWS.config.update({ region: 'eu-west-2' });
AWS.config.setPromisesDependency(Promise);

const docClient = new AWS.DynamoDB.DocumentClient();

const getUser = async id => {
  const doc = docClient
    .get({
      TableName: 'users',
      Key: { id },
    })
    .promise();

  return doc.Item;
};

const createUser = async ({ name, chatId }) => {
  const id = `telegram_${chatId}`;

  if (await getUser(id)) {
    return;
  }

  const user = {
    id,
    name,
    chatId,
    courses: [
      {
        id: 'sample',
        pos: 0,
      },
    ],
    nextTaskAt: Date.now(),
  };

  return docClient
    .put({
      TableName: 'users',
      Item: user,
    })
    .promise();
};

const getUsersForNewTask = async time => {
  const data = await docClient
    .scan({
      ExpressionAttributeValues: {
        ':d': time,
      },
      FilterExpression: 'nextTaskAt < :d',
      TableName: 'users',
    })
    .promise();
console.log(data);
  return data.Items;
};

const updateUserNextTask = async ({ id, courses, nextTaskAt }) => {
  return await docClient
    .update({
      Key: { id },
      ExpressionAttributeValues: {
        ':courses': courses,
        ':time': nextTaskAt,
      },
      UpdateExpression: 'set courses = :courses, nextTaskAt = :time',
      TableName: 'users',
    })
    .promise();
};

module.exports = {
  createUser,
  getUser,
  getUsersForNewTask,
  updateUserNextTask,
};
