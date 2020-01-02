module.exports = {
  hookTelegram: require('./hook-telegram'),
  sqsIncomingMessages: require('./sqs-incomming-messages'),
  sqsOutgoingMessages: require('./sqs-outgoing-messages'),
  sqsShortDelayTasks: require('./sqs-short-delay-tasks'),
  tick: require('./tick'),
};
