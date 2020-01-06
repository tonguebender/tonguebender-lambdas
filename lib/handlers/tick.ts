import { getUsersForNewTask, updateUserNextTaskAt } from '../users';
const { executeNextTask } = require('../tasks');

const hourRanges: [number, number][] = [
  [9, 10],
  [12, 13],
  [18, 19],
];

const messageDelay = 10 * 60 * 1000;

const isInBetween = (hour: number, [from, to]: [number, number]): boolean => hour >= from && hour < to;
const getNextAt = (date: Date) => {
  let next = new Date(date.getTime() + messageDelay);
  let nextHour = next.getHours();

  if (hourRanges.some((range) => isInBetween(nextHour, range))) {
    return next;
  }

  for (let i = 0; i < hourRanges.length; i++) {
    const h = hourRanges[i][0];
    if (nextHour < h) {
      next.setHours(h);
      next.setMinutes(0);
      return next;
    }
  }

  next.setHours(hourRanges[0][0]);
  next.setMinutes(0);
  next.setDate(next.getDate() + 1);
  return next;
};

export default async () => {
  const users = (await getUsersForNewTask(Date.now())) || [];

  return await Promise.all(
    users.map(async (user) => {
      await executeNextTask(user);

      await updateUserNextTaskAt({
        id: user.id,
        nextTaskAt: getNextAt(new Date()).getTime(),
      });
    }),
  );
};
