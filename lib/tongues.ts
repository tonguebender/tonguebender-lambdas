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

interface IDefinition {
  pk: string;
  ipa: string;
  def: IMeaning[];
}

interface IMeaning {
  word: string;
  def: string;
  example: string;
  speech_part: string;
  synonyms: string[];
}

export const getDefinition = async (word: string): Promise<IDefinition> => {
  const doc = await docClient
    .get({
      TableName: 'tongues',
      Key: { pk: word, sk: 'en-def' },
    })
    .promise();

  return doc.Item as IDefinition;
};
