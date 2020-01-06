import * as AWS from 'aws-sdk';
import { IUserTask } from './tasks';

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

export interface User {
  id: string;
  name: string;
  chatId: number;
  tasks: IUserTask[];
  nextTaskAt: number;
}

export const getUser = async (id: string): Promise<User> => {
  const doc = await docClient
    .get({
      TableName: 'users',
      Key: { id },
    })
    .promise();

  return doc.Item as User;
};

export const createUser = async ({ name, chatId }: { name: string; chatId: number }) => {
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
        type: 'COURSE_ITEM',
        courseId: 'sample-course',
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

export const getUsersForNewTask = async (time: number): Promise<User[]> => {
  const data = await docClient
    .scan({
      ExpressionAttributeValues: {
        ':d': time,
      },
      FilterExpression: 'nextTaskAt < :d',
      TableName: 'users',
    })
    .promise();

  return data.Items as User[];
};

export const updateUserTasks = async ({ id, tasks }: { id: string; tasks: IUserTask[] }) => {
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

export const updateUserNextTaskAt = async ({ id, nextTaskAt }: { id: string; nextTaskAt: number }) => {
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
