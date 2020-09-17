import * as http2 from 'http2';
import { ServerOptsInterface } from './server.interface';
import { pushStream, read, stopStream, write } from '../base/base.service';
import { ServerStreamInterface } from '../base/base.interface';
const { HTTP2_HEADER_PATH } = http2.constants;

let _server: http2.Http2Server;

const _serverOnError = (err: Error) => {
  console.error(err);
};

const close = (stream?: http2.Http2Stream): void => {
  if (stream) {
    stopStream(stream);
  } else if (_server) {
    _server.close();
    _server.unref();
  }
};

const startHttp2Server = ({ port }: ServerOptsInterface): http2.Http2Server => {
  try {
    _server = http2.createServer();
    _server.listen(port);
    _server.on('error', _serverOnError);
    return _server;
  } catch (e) {
    console.log(e);
  }
};

const onStream = (
  onRequestCallback: (stream: ServerStreamInterface) => void,
): void => {
  _server.on(
    'stream',
    (
      stream: http2.ServerHttp2Stream,
      requestHeaders: http2.IncomingHttpHeaders,
    ) => {
      const streamPath = requestHeaders[HTTP2_HEADER_PATH] as string;
      stream.on('error', (err) => {
        console.log(`Stream with path: ${streamPath} error: \n`, err);
      });
      onRequestCallback({
        _stream: stream,
        write: write(stream),
        read: read(stream),
        path: streamPath,
        pushStream: pushStream(stream),
      });
    },
  );
};

const getServer = (): http2.Http2Server => {
  if (!_server) {
    throw new Error('Start http2 server firstly.');
  }
  return _server;
};

export { startHttp2Server, onStream, write, read, close, getServer };
