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

const getQuiz = async (id) => {
  const doc = await docClient
    .get({
      TableName: 'quizzes',
      Key: { id },
    })
    .promise();

  return doc.Item;
};

const getQuizzes = async () => {
  const doc = await docClient
    .scan({
      TableName: 'quizzes',
    })
    .promise();

  return doc.Items;
};

module.exports = {
  getQuiz,
  getQuizzes,
};
