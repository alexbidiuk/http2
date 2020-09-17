import * as http2 from 'http2';

interface BaseStreamInterface {
  _stream: http2.Http2Stream;
  write: (data: string | Record<any, any>) => void;
  read: (onData: (data: string | Record<any, any>) => void) => void;
  path: string;
}

interface ServerStreamInterface extends BaseStreamInterface {
  _stream: http2.ServerHttp2Stream;
  pushStream: (data: string | Record<any, any>, path?: string) => void;
}

interface ClientStreamInterface extends BaseStreamInterface {
  _stream: http2.ClientHttp2Stream;
}

export { ServerStreamInterface, ClientStreamInterface };
