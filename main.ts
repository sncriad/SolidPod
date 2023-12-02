
// Create basic server ping for handin
import { createServer, IncomingMessage, ServerResponse, OutgoingHttpHeader} from 'http';
// This works but VSCode is jank
import type { RequestMethod, SolidTokenVerifierFunction } from '@solid/access-token-verifier';
import { readFile, editFile, fileAccessOptions, createOrReplaceFile, deleteFile } from '../SolidPod/fileAccess'
// This also works but VSCode is jank
import { createSolidTokenVerifier } from '@solid/access-token-verifier';
import {Request, Response} from 'express'
import * as express from 'express';
var cors = require('cors')
import { readFile, editFile, fileAccessOptions, createOrReplaceFile, deleteFile } from 'fileAccess';

const hostname = '127.0.0.1';
// Listening on this port on my wifi right now!
const port = 44444;
 
const app = express();
app.use(cors())

const solidOidcAccessTokenVerifier: SolidTokenVerifierFunction = createSolidTokenVerifier();

// Basic authorization script for given HTTP server. https://github.com/CommunitySolidServer/access-token-verifier


app.get('/', async (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'dpop, authorization');
  try {
    // Should throw error if request parses badly.
    const { client_id: clientId, webid: webId } = await solidOidcAccessTokenVerifier(
      req.headers.authorization as string
      , {
        header : req.headers.dpop as string,
        method : req.method as RequestMethod,
        // This would need to be changed if its running on another device. For now this is fine to HC
        url : "http://24.250.32.37:44444/" as string
      }
    );

    console.log(`Verified Access Token via WebID: ${webId} and for client: ${clientId}`);

    if (req.method === 'GET') {
      readFile(req, res);
    } else if (req.method === 'OPTIONS' || req.method === 'HEAD' ) {
      fileAccessOptions(res);
    } else if (req.method === 'POST' || req.method === 'PUT') {
      createOrReplaceFile(req, res);
    } else if (req.method === 'PATCH') {
      editFile(req, res); 
    } else if (req.method === 'DELETE') {
      deleteFile(req, res); 
    }
    //... Look at retrievable resources from this point forward
    // Enter ACL and attempt to retrieve resource... may require more work from here, but we can cache client/webId
  }catch (error: unknown) {
    const message = `Either not logged in or connection is being established. Respond with sec-headers`;
  }
});
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${port}`);
});
// const server = createServer(async (request, response) => {
//   response.setHeader('Access-Control-Allow-Origin', '*');
//   response.setHeader('Access-Control-Allow-Headers', 'dpop, authorization');
//   response.end();
//     try {
//       // Should throw error if request parses badly.
//       const { client_id: clientId, webid: webId } = await solidOidcAccessTokenVerifier(
//         request.headers.authorization as string
//         , {
//           header : request.headers.dpop as string,
//           method : request.method as RequestMethod,
//           url : "http://24.250.32.37:44444/" as string
//         }
//       );

//       console.log(`Verified Access Token via WebID: ${webId} and for client: ${clientId}`);
//       //... Look at retrievable resources from this point forward
//       // Enter ACL and attempt to retrieve resource... may require more work from here, but we can cache client/webId
//     }catch (error: unknown) {
//       const message = `Either not logged in or connection is being established. Respond with sec-headers`;
//       console.log(message);
//     }
// });

// server.listen(port, (error) => {
//   if (error) {
//     console.log(error);
//   } else {
//     console.log(`Server listening on port ${port}`);
//     // Loop for authentication initialization (Will break down later)
//   }
// });
