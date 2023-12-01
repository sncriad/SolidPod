
// Create basic server ping for handin
import { createServer, IncomingMessage, ServerResponse, OutgoingHttpHeader} from 'http';
// This works but VSCode is jank
import type { RequestMethod, SolidTokenVerifierFunction } from '@solid/access-token-verifier';
import { readFile, editFile, fileAccessOptions, createOrReplaceFile, deleteFile } from '../SolidPod/fileAccess'
// This also works but VSCode is jank
import { createSolidTokenVerifier } from '@solid/access-token-verifier';

const hostname = '127.0.0.1';
// Listening on this port on my wifi right now!
const port = 44444;
 
const solidOidcAccessTokenVerifier: SolidTokenVerifierFunction = createSolidTokenVerifier();

// Basic authorization script for given HTTP server. https://github.com/CommunitySolidServer/access-token-verifier

const server = createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Headers', 'dpop, authorization');
  response.end();
    try {
      // Should throw error if request parses badly.
      const { client_id: clientId, webid: webId } = await solidOidcAccessTokenVerifier(
        request.headers.authorization as string
        , {
          header : request.headers.dpop as string,
          method : request.method as RequestMethod,
          url : "http://24.250.32.37:44444/" as string
        }
      );

      console.log(`Verified Access Token via WebID: ${webId} and for client: ${clientId}`);

      if (request.method === 'GET') {
        // @ts-expect-error
        readFile(request, response);
      } else if (request.method === 'OPTIONS' || request.method === 'HEAD' ) {
        // @ts-expect-error
        fileAccessOptions(response);
      } else if (request.method === 'POST' || request.method === 'PUT') {
        // @ts-expect-error
        createOrReplaceFile(request, response);
      } else if (request.method === 'PATCH') {
        // @ts-expect-error
        editFile(request, response); 
      } else if (request.method === 'DELETE') {
        // @ts-expect-error
        deleteFile(request, response); 
      }
      //... Look at retrievable resources from this point forward
      // Enter ACL and attempt to retrieve resource... may require more work from here, but we can cache client/webId
    }catch (error: unknown) {
      const message = `Either not logged in or connection is being established. Respond with sec-headers`;
      console.log(message);
    }
    // response.setHeader('Access-Control-Allow-Oriogi')
});

//@ts-expect-error
server.listen(port, (error) => {
  if (error) {
    console.log(error);
  } else {
    console.log(`Server listening on port ${port}`);
    // Loop for authentication initialization (Will break down later)
  }
});