import * as AWSMock from 'aws-sdk-mock';
// import * as AWS from 'aws-sdk';
import { GetItemInput } from 'aws-sdk/clients/dynamodb';
// import { sqsIncomingMessages } from './index';

afterEach(() => {
  console.log('restore')
  jest.clearAllMocks();
  AWSMock.restore();
});

test('should process message', async () => {
  const mock = jest.fn();

  const AWS = require('aws-sdk');
  AWSMock.setSDKInstance(AWS);
  AWSMock.mock('SQS', 'sendMessage', (p: GetItemInput, cb: Function) => {
    console.log('SQS', p);
    cb(null, mock());
  });
  AWSMock.mock('DynamoDB.DocumentClient', 'get', (p: GetItemInput, cb: Function) => {
    console.log('mock called', p);
    cb(null, { Item: { pk: 'foo', sk: 'bar', tasks: [] } });
  });

  console.log('>>>>>>>>>');
  const sqsIncomingMessages = require('./sqs-incoming-messages').default;

  await sqsIncomingMessages({
    Records: [
      // @ts-ignore
      {
        body: JSON.stringify({
          agent: 'string',
          chatId: 123,
          text: 'blah',
        }),
      },
    ],
  });

  expect(mock).toHaveBeenCalled();
});

test('should process message2', async () => {
  const mock = jest.fn();

  const AWS = require('aws-sdk');
  AWSMock.setSDKInstance(AWS);
  AWSMock.mock('SQS', 'sendMessage', (p: GetItemInput, cb: Function) => {
    console.log('SQS2', p);
    cb(null, mock());
  });
  AWSMock.mock('DynamoDB.DocumentClient', 'get', (p: GetItemInput, cb: Function) => {
    console.log('mock2 called', p);
    cb(null, { Item: { pk: 'foo', sk: 'bar', tasks: [] } });
  });

  const sqsIncomingMessages = require('./sqs-incoming-messages').default;

  await sqsIncomingMessages({
    Records: [
      // @ts-ignore
      {
        body: JSON.stringify({
          agent: 'string',
          chatId: 123,
          text: 'blah2',
        }),
      },
    ],
  });

  expect(mock).toHaveBeenCalled();
});

export default {};
