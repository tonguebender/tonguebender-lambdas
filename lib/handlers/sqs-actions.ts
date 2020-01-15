import { SQSEvent, SQSRecord } from 'aws-lambda';
import { IAction, processAction } from '../actions';

const IS_OFFLINE = process.env.IS_OFFLINE;

export default async (event: SQSEvent) => {
  await Promise.all(
    event.Records.map(async (msg: SQSRecord) => {
      const action: IAction = JSON.parse(msg.body);

      if (IS_OFFLINE) {
        console.log(`ACTION ${action.type} ${action.chatId}: ${action.data}`);
      }

      return processAction(action);
    }),
  );

  return {
    statusCode: 200,
    body: ``,
  };
};
