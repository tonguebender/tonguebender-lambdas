const AWS = require('aws-sdk');

const IS_OFFLINE = process.env.IS_OFFLINE;

AWS.config.update({ region: 'eu-west-2' });
AWS.config.setPromisesDependency(Promise);

const docClient = new AWS.DynamoDB.DocumentClient(
  IS_OFFLINE
    ? {
        region: 'localhost',
        endpoint: 'http://localhost:3001',
      }
    : {},
);

const getUser = async (id) => {
  const doc = await docClient
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
    tasks: [
      {
        type: 'course',
        id: 'sample-course',
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

const getUsersForNewTask = async (time) => {
  const data = await docClient
    .scan({
      ExpressionAttributeValues: {
        ':d': time,
      },
      FilterExpression: 'nextTaskAt < :d',
      TableName: 'users',
    })
    .promise();

  return data.Items;
};

const updateUserTasks = async ({ id, tasks }) => {
  return await docClient
    .update({
      Key: { id },
      ExpressionAttributeValues: {
        ':tasks': tasks,
      },
      UpdateExpression: 'set tasks = :tasks',
      TableName: 'users',
    })
    .promise();
};

const updateUserNextTaskAt = async ({ id, nextTaskAt }) => {
  return await docClient
    .update({
      Key: { id },
      ExpressionAttributeValues: {
        ':time': nextTaskAt,
      },
      UpdateExpression: 'set nextTaskAt = :time',
      TableName: 'users',
    })
    .promise();
};

module.exports = {
  createUser,
  getUser,
  getUsersForNewTask,
  updateUserTasks,
  updateUserNextTaskAt,
};
