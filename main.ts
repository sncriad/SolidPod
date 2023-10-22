
import { createServer, IncomingMessage, ServerResponse } from 'http';
 
const port = 5000;
 
const server = createServer((request: IncomingMessage, response: ServerResponse) => {
  response.end('Hello world!');
});
//@ts-expect-error
server.listen(port, (error) => {
  if (error) {
    console.log(error);
  } else {
    console.log(`Server listening on port ${port}`);
  }
});