import { SQSEvent, SQSRecord } from 'aws-lambda';
import { getUser } from '../users';
const { executeNextTask } = require('../tasks');

export default async (event: SQSEvent) => {
  await Promise.all(
    event.Records.map(async (msg: SQSRecord) => {
      const data = JSON.parse(msg.body);
      const user = await getUser(data.userId);

      await executeNextTask(user);
    }),
  );
};
