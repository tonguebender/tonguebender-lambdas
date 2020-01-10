module.exports = {
  roots: ['<rootDir>/lib'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testRegex: '((\\.|/)(test|spec))\\.ts?$',
  moduleFileExtensions: ['ts', 'js', 'json'],
};
