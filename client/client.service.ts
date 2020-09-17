import * as http2 from 'http2';
import { ClientOptsInterface } from './client.interface';
import { read, write, stopStream } from '../base/base.service';
import { ClientStreamInterface } from '../base/base.interface';

const { HTTP2_HEADER_PATH } = http2.constants;
let _client: http2.ClientHttp2Session;
let _startClient;

const _clientOnError = (err: Error) => {
  console.error(err);
};
const _clientOnTimeout = () => {
  console.error('Client session timeout.');
};

const close = (stream?: http2.Http2Stream): void => {
  if (stream) {
    stopStream(stream);
  } else if (_client) {
    _client.close();
    _client.destroy();
  }
};

const startHttp2Client = (
  options: ClientOptsInterface,
): Promise<http2.ClientHttp2Session> => {
  return new Promise<http2.ClientHttp2Session>((resolve, reject) => {
    try {
      const start = ({ uri }: ClientOptsInterface) => () => {
        _client = http2.connect(uri, (session) => {
          resolve(session);
        });
        _client.on('error', _clientOnError);
        _client.on('timeout', _clientOnTimeout);
      };
      _startClient = start(options);
      _startClient();
    } catch (e) {
      reject(e);
    }
  });
};

const _sendRequest = (
  path = '/',
  options: http2.ClientSessionRequestOptions = { endStream: false },
): http2.ClientHttp2Stream => {
  if (_client.destroyed || _client.closed) {
    _startClient();
  }
  return _client.request({ ':path': path }, options);
};

const openSession = (
  path = '/',
  options?: http2.ClientSessionRequestOptions,
): ClientStreamInterface => {
  const stream = _sendRequest(path, options);
  stream.on('error', (err) => {
    console.log(`Stream with path: ${path} error: \n`, err);
  });
  return {
    path,
    _stream: stream,
    write: write(stream),
    read: read(stream),
  };
};

const onStream = (
  onRequestCallback: (stream: ClientStreamInterface) => void,
): void => {
  _client.on(
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
      });
    },
  );
};

const getClient = (): void | http2.ClientHttp2Session => {
  if (!_client) {
    throw new Error('Start http2 client firstly.');
  }
  return _client;
};

const pingServer = (
  callback: (
    err?: Error,
    data?: { duration: number; payload?: string },
  ) => void,
  pingTimeoutMs = 3000,
  payloadToPing?: Buffer,
): (() => void) => {
  let timeout;
  let run = true;
  const ping = () => {
    if (_client.destroyed || _client.closed) {
      callback(new Error('Client destroyed or closed.'));
    }
    _client.ping(payloadToPing, (err, duration, payload) => {
      if (!err) {
        callback(null, {
          duration,
          ...(payloadToPing ? { payload: payload.toString() } : {}),
        });
      } else {
        callback(err);
      }
    });

    if (run) {
      timeout = setTimeout(ping, pingTimeoutMs);
    }
  };
  ping();
  return () => {
    run = false;
    clearTimeout(timeout);
  };
};

export {
  openSession,
  startHttp2Client,
  read,
  write,
  close,
  onStream,
  getClient,
  pingServer,
};
