import * as AWS from 'aws-sdk';

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

interface ICourse {
  title: string;
  description: string;
  id: string;
  items: Array<{
    type: string;
    text: string;
  }>;
}

export const getCourse = async (id: string): Promise<ICourse> => {
  const doc = await docClient
    .get({
      TableName: 'courses',
      Key: { id },
    })
    .promise();

  return doc.Item as ICourse;
};
