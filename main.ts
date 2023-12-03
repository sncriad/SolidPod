
// Create basic server ping for handin
import { createServer, IncomingMessage, ServerResponse, OutgoingHttpHeader} from 'http';
// This works but VSCode is jank
import type { RequestMethod, SolidTokenVerifierFunction } from '@solid/access-token-verifier';
import { handleGet, editFile, handlePutRequest, deleteFile } from '../SolidPod/fileAccess'
// This also works but VSCode is jank
import { createSolidTokenVerifier } from '@solid/access-token-verifier';
import {Request, Response} from 'express'
import * as express from 'express';
const cors = require('cors')
const bodyParser = require('body-parser')
// Listening on this port on my wifi right now!
const port = 44444;
 
const app = express();
app.use(cors())
app.use(bodyParser.raw({ inflate: true, limit: '100kb', type: "*/*" }))
const solidOidcAccessTokenVerifier: SolidTokenVerifierFunction = createSolidTokenVerifier();

app.all("*", async (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader("Access-Control-Allow-Credentials", 'true');
  res.setHeader('Access-Control-Expose-Headers', 'Authorization, User, Location, Link, Vary, Last-Modified, ETag, Accept-Patch, Accept-Post, Updates-Via, Allow, WAC-Allow, Content-Length, WWW-Authenticate, MS-Author-Via, X-Powered-By');
  res.setHeader('Allow', "OPTIONS, HEAD, GET, PATCH, POST, PUT, DELETE")
  res.setHeader('Content-Type', 'text/turtle')
  try {
    // Should throw error if request parses badly.
    console.log(req.method)
    const { client_id: clientId, webid: webId } = await solidOidcAccessTokenVerifier(
      req.headers.authorization as string
      , {
        header : req.headers.dpop as string,
        method : req.method as RequestMethod,
        // This would need to be changed if its running on another device. For now this is fine to HC
        url : "http://24.250.32.37:44444" + req.url as string
      }
    );
    if (req.method === 'GET') {
      handleGet(req, res, webId);
    } else if (req.method === 'PUT' || req.method === 'POST') {
      handlePutRequest(req, res, webId);
    } else if (req.method === 'DELETE') {
      deleteFile(req, res, webId); 
    }
    // } else if (req.method === 'OPTIONS') {
    //   res.status(204);
    //   res.send();
    // }  else if (req.method == 'HEAD'){
    //   res.status(404);
    //   res.send();
    // }
    // res.send()
    // } else if (req.method === 'PATCH') {
    //   editFile(req, res); 
    //... Look at retrievable resources from this point forward
    // Enter ACL and attempt to retrieve resource... may require more work from here, but we can cache client/webId
      // res.send(message)
  }catch (error: unknown) {
    // error = true;
    const message = `Either not logged in or connection is being established. Respond with sec-headers`;
    res.setHeader('WWW-Authenticate', '*');
    // res.status(401)
    res.send();
  }
});
// If running on localhost, delete the "0.0.0.0"
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${port}`);
});
