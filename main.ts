
// Create basic server ping for handin
import { createServer, IncomingMessage, ServerResponse, OutgoingHttpHeader} from 'http';
// This works but VSCode is jank
import type { RequestMethod, SolidTokenVerifierFunction } from '@solid/access-token-verifier';
// This also works but VSCode is jank
import { createSolidTokenVerifier } from '@solid/access-token-verifier';
import { readFile, editFile, fileAccessOptions, createOrReplaceFile } from 'fileAccess';

const hostname = '127.0.0.1';
// Listening on this port on my wifi right now!
const port = 44444;
 
const solidOidcAccessTokenVerifier: SolidTokenVerifierFunction = createSolidTokenVerifier();

// Basic authorization script for given HTTP server. https://github.com/CommunitySolidServer/access-token-verifier

const server = createServer(async (request, response) => {
    try {
      // Should throw error if request parses badly.
      const { client_id: clientId, webid: webId } = await solidOidcAccessTokenVerifier(
        request.headers.authorization as string
      );
      console.log(`Verified Access Token via WebID: ${webId} and for client: ${clientId}`);
      //... Look at retrievable resources from this point forward
      // Enter ACL and attempt to retrieve resource... may require more work from here, but we can cache client/webId
    } catch (error: unknown) {
      // Access token cannot be validate or does not exist. Begin handshake accordingly.
      const message = `Error verifying Access Token via WebID: ${(error as Error).message}. If this contains a WWW-authenticate (401 Header) we're doing alright`;
      response.setHeader('WWW-Authenticate', 'Bearer scope="openid webid"');
      response.statusCode = 401;
      response.end(message);
    }
    if (request.method === 'GET') {
      readFile(request, response);
    } else if (request.method === 'OPTIONS' || request.method === 'HEAD' ) {
      fileAccessOptions(response);
    } else if (request.method === 'POST' || request.method === 'PUT') {
      createOrReplaceFile(request, response);
    } else if (request.method === 'PATCH') {
      editFile(request, response); // QUESTION: is this what PATCH is for? 
    }
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
