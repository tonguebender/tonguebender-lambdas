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

export interface IQuizItem {
  type: string;
  text?: string;
  answers?: string[];
  options?: string[];
}
export interface IQuiz {
  title: string;
  description: string;
  id: string;
  items: IQuizItem[];
}

export const getQuiz = async (id: string): Promise<IQuiz> => {
  const doc = await docClient
    .get({
      TableName: 'quizzes',
      Key: { id },
    })
    .promise();

  return doc.Item as IQuiz;
};

export const getQuizzes = async (): Promise<IQuiz[]> => {
  const doc = await docClient
    .scan({
      TableName: 'quizzes',
    })
    .promise();

  return doc.Items as IQuiz[];
};
