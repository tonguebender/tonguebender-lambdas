import Telegraf from 'telegraf';
import { IAction, ACTIONS, putAction } from '../actions';

interface ITelegramHookRequest {
  body: string;
}

const bot = new Telegraf(process.env.TELEGRAM_TOKEN || '');

export interface ITelegramUpdate {
  update_id: number;
  message: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name: string;
      username: string;
      language_code: string;
    };
    chat: { id: number; first_name: string; last_name: string; username: string; type: string };
    date: number;
    text: string;
  };
}

export const convertMessageToAction = (update: ITelegramUpdate): IAction => {
  const text = update.message.text;
  const chatId = update.message.chat.id;
  const message = text.toLowerCase().trim();
  const parts = message.split(' ');

  switch (parts[0]) {
    case '/start':
      return {
        type: ACTIONS.START,
        chatId,
        data: update,
      };
    case 'hi':
      return {
        type: ACTIONS.SAY_HI,
        chatId,
      };
    case 'next':
      return {
        type: ACTIONS.NEXT,
        chatId,
      };
    case 'quiz':
      return {
        type: ACTIONS.START_QUIZ,
        chatId,
      };
    case 'define':
      return {
        type: ACTIONS.DEFINE,
        chatId,
        data: {
          word: parts[1],
        },
      };
    default:
      return {
        type: ACTIONS.REPLY_TO,
        chatId,
        data: update,
      };
  }
};

export default async (event: ITelegramHookRequest) => {
  if (event.body) {
    try {
      const update: ITelegramUpdate = JSON.parse(event.body);

      await putAction(convertMessageToAction(update));

      await bot.handleUpdate(update);
    } catch (e) {
      console.log(e);
    }
  }

  return {
    statusCode: 200,
    body: ``,
  };
};
