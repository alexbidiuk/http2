import * as server from '../server/server.service';
import configs from './configs';
import { STREAM_PATH } from './constants';

const startServer = async () => {
  await server.startHttp2Server({ port: configs.PORT });
  server.onStream(({ path, read, write }) => {
    if (path === STREAM_PATH) {
      write({ payload: 'Hello from server.' });
      read((data) => {
        console.log('Received from client: ', data);
      });
    }
  });

};

export default startServer;
