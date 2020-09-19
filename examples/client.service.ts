import * as client from '../client';
import configs from './configs';
import { STREAM_PATH } from './constants';

const startClient = async () => {
  await client.startHttp2Client({ uri: `${configs.URI}:${configs.PORT}` });
  // note that for each write you need to open a new stream, because after write writable part becomes ended
  const stream = client.openStream(STREAM_PATH);
  stream.write({ payload: 'Hello from client.' });
  stream.read((data) => {
    console.log('Received from server: ', data);
  });
};

export default startClient;

