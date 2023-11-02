
// Create basic server ping for handin
import { createServer, IncomingMessage, ServerResponse, OutgoingHttpHeader} from 'http';
//@ts-expect-error - I think that these imports work, VSCode is just being screwy
import type { RequestMethod, SolidTokenVerifierFunction } from '@solid/access-token-verifier';
//@ts-expect-error - I think that these imports work, VSCode is just being screwy
import { createSolidTokenVerifier } from '@solid/access-token-verifier';

const hostname = '127.0.0.1';
// Listening on this port on my wifi
const port = 44444;
 
const solidOidcAccessTokenVerifier: SolidTokenVerifierFunction = createSolidTokenVerifier();

// Basic authorization script for given HTTP server. https://github.com/CommunitySolidServer/access-token-verifier

const server = createServer((request, response) => {
    try {
      // Should throw error if request parses badly.
      const { client_id: clientId, webid: webId } = solidOidcAccessTokenVerifier(
        request.headers.authorization as string
        // Ignoring DPop parameters for now, probably some security issue but ill figure it out.
        // ,
        // {
        //   // Probably passing in the wrong field here but it probably works for now.
        //   header: request.headers.authorization as string,
        //   // From reading through library, standard HTTP request method casts to correct one
        //   method: request.method as RequestMethod,
        //   // Request URL can just be obtained from this.
        //   url: request.url as string
        // }
      );
      console.log(`Verified Access Token via WebID: ${webId} and for client: ${clientId}`);
      //... Look at retrievable resources from this point forward
      // Enter ACL and attempt to retrieve resource... may require more work from here, but we can cache client/webId
    }catch (error: unknown) {
      // Access token cannot be validate or does not exist. Begin handshake accordingly.
      const message = `Error verifying Access Token via WebID: ${(error as Error).message}`;
      response.setHeader('WWW-Authenticate', 'Bearer scope="openid webid"');
      response.statusCode = 401;
      response.end(message);
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