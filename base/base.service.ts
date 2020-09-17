import { Http2Stream, ServerHttp2Stream } from 'http2';
import { Readable } from 'stream';

const _isStreamAlive = (stream: Http2Stream): boolean => {
  return !(stream.destroyed || stream.closed || stream.aborted);
};

const stopStream = (stream: Http2Stream): void => {
  if (stream && !stream.destroyed && !stream.closed && !stream.aborted) {
    stream.end();
  }
};

const write = (stream: Http2Stream) => (
  data: Record<any, any> | string,
): void => {
  if (_isStreamAlive(stream)) {
    const dataStringified = JSON.stringify(data);
    const dataToSendStream = Readable.from(dataStringified);
    dataToSendStream.pipe(stream);
  }
};

const pushStream = (stream: ServerHttp2Stream) => (
  data: string | Record<any, any>,
  path = '/',
): void => {
  if (_isStreamAlive(stream)) {
    stream.pushStream({ ':path': path }, (err, pushStream, headers) => {
      if (err) {
        throw err;
      }
      write(pushStream)(data);
    });
  }
};

const read = (stream: Http2Stream) => (
  onDataCallback: (data: Record<string, any>) => void,
): void => {
  if (_isStreamAlive(stream)) {
    stream.setEncoding('utf8');
    let data = '';
    stream.on('data', (chunk) => {
      const parsedChunk = chunk instanceof Buffer ? chunk.toString() : chunk;
      data += parsedChunk;
    });
    stream.on('end', () => {
      try {
        onDataCallback(JSON.parse(data));
      } catch (e) {
        console.log('BASE HTTP2 SERVICE', e);
      }
    });
  }
};

export { write, read, stopStream, pushStream };
