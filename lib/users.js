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

module.exports = {
  createUser,
  getUser,
};
