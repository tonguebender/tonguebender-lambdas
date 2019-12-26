const AWS = require('aws-sdk');

AWS.config.update({ region: 'eu-west-2' });
AWS.config.setPromisesDependency(Promise);

const docClient = new AWS.DynamoDB.DocumentClient();

const getCourse = async (id) => {
  const doc = docClient
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
