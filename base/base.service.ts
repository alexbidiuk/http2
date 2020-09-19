import { Http2Stream } from 'http2';
import { Readable } from 'stream';

// util function to check if stream is alive
const isStreamAlive = (stream: Http2Stream): boolean => {
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
  if (isStreamAlive(stream)) {
    // converting data to json and transform it to readable stream
    const dataStringified = JSON.stringify(data);
    const dataToSendStream = Readable.from(dataStringified);
    // using pipe to provide backpressure
    dataToSendStream.pipe(stream);
  }
};
// method receives stream to read and returns function that receives callback where data from stream will be passed
const read = (stream: Http2Stream) => (
  onDataCallback: (data: Record<string, any>) => void,
): void => {
  if (isStreamAlive(stream)) {
    stream.setEncoding('utf8');
    let data = '';
// setting listeners for 'data' and 'end' events. On the end we are passing parsed data to callback
    stream.on('data', (chunk) => {
      const parsedChunk = chunk instanceof Buffer ? chunk.toString() : chunk;
      data += parsedChunk;
    });
    stream.on('end', () => {
      try {
        if (data && data.length) {
          onDataCallback(JSON.parse(data));
        }
      } catch (e) {
        console.log('BASE HTTP2 SERVICE', e);
      }
    });
  }
};

export { write, read, stopStream, isStreamAlive };
