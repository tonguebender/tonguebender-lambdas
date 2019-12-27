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

const getCourse = async id => {
  const doc = await docClient
    .get({
      TableName: 'courses',
      Key: { id },
    })
    .promise();

  return doc.Item;
};

module.exports = {
  getCourse,
};
