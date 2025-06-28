import { env } from 'process';

const conf = {
  get: (key: string) => {
    return env[key];
  },
};

export default conf;
