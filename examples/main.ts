import startClient from './client.service';
import startServer from './server.service';

const startApp = async () => {
  await startServer();
  await startClient();
};

startApp();
