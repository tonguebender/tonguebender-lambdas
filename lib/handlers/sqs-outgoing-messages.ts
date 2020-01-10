import Telegraf from 'telegraf';
import { SQSEvent, SQSRecord } from 'aws-lambda';

const bot = new Telegraf(process.env.TELEGRAM_TOKEN || '');

export interface IOutgoingMessage {
  chatId: number;
  text: string;
  data?: {
    buttons?: string[];
  };
}

export default async (event: SQSEvent) => {
  await Promise.all(
    event.Records.map(async (msg: SQSRecord) => {
      const data: IOutgoingMessage = JSON.parse(msg.body);
      try {
        return await bot.telegram.sendMessage(data.chatId, data.text, {
          parse_mode: 'Markdown',
          reply_markup: data.data?.buttons
            ? { keyboard: [data.data.buttons.map((btn) => ({ text: btn }))], one_time_keyboard: true }
            : { remove_keyboard: true },
        });
      } catch (e) {
        console.log(e);
      }
    }),
  );

  return {
    statusCode: 200,
    body: ``,
  };
};
