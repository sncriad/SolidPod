
// Create basic server ping for handin
import { createServer, IncomingMessage, ServerResponse, OutgoingHttpHeader} from 'http';
// This works but VSCode is jank
import type { RequestMethod, SolidTokenVerifierFunction } from '@solid/access-token-verifier';
import { handleGet, editFile, handlePutRequest, deleteFile, handleHead} from '../SolidPod/fileAccess'
// This also works but VSCode is jank
import { createSolidTokenVerifier } from '@solid/access-token-verifier';
import {Request, Response} from 'express'
import * as express from 'express';
const cors = require('cors')
const bodyParser = require('body-parser')
// Listening on this port on my wifi right now!
const port = 44444;
const https = require("https")
const app = express();
app.use(cors())
app.use(bodyParser.raw({ inflate: true, limit: '100kb', type: "*/*" }))
const solidOidcAccessTokenVerifier: SolidTokenVerifierFunction = createSolidTokenVerifier();

//HTTPS Secure key stuff - will need to regenerate stuff on other devices:
const fs = require('fs');
const key = fs.readFileSync('./key.pem', 'utf8');
const cert = fs.readFileSync('./cert.pem', 'utf8');

app.all("*", async (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader("Access-Control-Allow-Credentials", 'true');
  res.setHeader('Access-Control-Expose-Headers', 'Authorization, User, Location, Link, Vary, Last-Modified, ETag, Accept-Patch, Accept-Post, Updates-Via, Allow, WAC-Allow, Content-Length, WWW-Authenticate, MS-Author-Via, X-Powered-By');
  res.setHeader('Allow', "OPTIONS, HEAD, GET, PATCH, POST, PUT, DELETE")
  res.setHeader('Content-Type', 'text/turtle')
  var use = req.url
  try {
    // Should throw error if request parses badly.
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
    } else if (req.method === 'PUT' || req.method === 'POST' || req.method == 'PATCH') {
      console.log(req.url);
      handlePutRequest(req, res, webId);
    } else if (req.method === 'DELETE') {
      deleteFile(req, res, webId); 
    } else if (req.method == 'HEAD'){
      handleHead(req, res, webId);
      res.send();
    }else if (req.method === 'OPTIONS') {
      res.setHeader("Allow", "OPTIONS, HEAD, GET, PATCH, POST, PUT, DELETE");
      res.status(204);
      res.send();
    }
    // Note - Server does not support sparql stuff at the moment.
  }catch (error: unknown) {
    // error = true;
    console.log(error)
    res.status(401)
    res.send();
  }
});
var httpsServer = https.createServer({key: key, cert: cert}, app);
// If running on localhost, delete the "0.0.0.0"
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${port}`);
});
// httpsServer.listen(44444, () => {
//     console.log(`Server running at http://localhost:${port}`);
//   });