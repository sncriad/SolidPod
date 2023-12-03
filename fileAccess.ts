const http = require('http');
var path = require('path');
const request = require('request');
const fs = require('fs');
const crypto = require('crypto')
 
import { Request, Response } from 'express';
import W3CHeaders from './constants/defaultHeaders';
import { readFileSync } from 'fs';
import { mkdirp } from 'mkdirp';


const headers = {
  'Allow': 'GET, HEAD, OPTION', 
  'Accept-Patch': 'application/text', 
  'Accept-Put': 'application/text', 
  'Accept-Post': 'application/text'
} 
// Code for file handling based off/adapted from: https://github.com/timbl/ldnode/blob/master/lib/ldp.js#L88
// Function to generate a simulation of LDP file structure.
function generateDirectorySimLDP(dirpath : string, hash: string, stats : any) : string{
  var message = W3CHeaders;
  var prefixes = "@prefix " + "rec" +hash.substring(0, 5) + ": <>.\n";
  // Add "current top level directory"
  var toplevel = "rec" + hash.substring(0, 5) + ":\n";
  var resources = "";
  toplevel += "     dct:modified " + '"' + stats.mtime.toJSON() + '"' + "^^xsd:dateTime;\n";
  var rest = "";
  // Callback abomination
  const filenames = fs.readdirSync(dirpath);
  if(filenames.length != 0){
    toplevel += "     ldp:contains\n";
  }
  filenames.forEach(
    (file : string) => {
      try{
      const stats = fs.statSync(dirpath + file +"/");
          resources += (resources != '') ? ', ' : "     "
          prefixes += '@prefix ' + file.substring(0, 3) + ': </' + file + '/>.\n';
          if(stats.isDirectory()){
            // Temporary resource mapping
            resources += file.substring(0, 3) + ":"
            rest += file.substring(0, 3) + ":\n"
            rest += '     a ldp:BasicContainer, ldp:Container, ldp:Resource;\n';
          } else {
            resources += '</' + file + '/>'
            rest += '</' + file + '/>\n'
            rest += '     a vnd:Resource, ldp:Resource;\n';
          }
          rest += '     dct:modified ' + '"' + stats.mtime.toJSON() + '"' + "^^xsd:dateTime;\n";
          rest += '     stat:mtime ' + stats.mtimeMs + ";\n";
          rest += '     stat:size ' + stats.blksize + " .\n";
        } catch {
        console.log("No idea how this managed to happen;")
      }
    }
  );
  prefixes += "\n";
  resources += resources ? ";\n" : "";
  message = message + prefixes + toplevel + resources + "     stat:mtime " + stats.mtimeMs + ";\n" + "     stat:size " + stats.blksize + ".\n" + rest;
  return message;
}
export async function handleGet(req: Request, res: Response, webId : string) : Promise<any>{
  var hash = crypto.createHash('sha256').update("giberish").digest('hex');
  const dirpath = "UserData/" + hash + req.url;
  // TODO - Add dirpath formatting properly.
  let message : any = ""
  try{
    const stats = fs.statSync(dirpath);
    if(stats.isDirectory()) {
        message = generateDirectorySimLDP(dirpath, hash, stats);
        res.status(200);
     } else {
        message = readFileSync(dirpath);
        res.status(200);
     }
  } catch {
    message = "Requested File/Read ran into issues";
  } finally { 
    res.send(message);
  }
}

export async function editFile(req: Request, res: Response): Promise<void> {
  const dirPath = req.url + "";
  const slug = req.headers.slug;
  const link = req.headers.link;
  if (!slug || !link) {
    res.status(400).send("Slug and link headers required");
    return;
  }
  const dirPathWellFormed = await fs.statSync(dirPath).isDirectory(); 
  if (dirPathWellFormed) {
    res.writeHead(200, headers);
    const stuffToWrite = req.body;
    fs.appendFile(dirPath, stuffToWrite);
  } else {
    res.status(400).send("URL must be a directory path");
  }
};

// for post and put requests
export async function handlePutRequest(req: Request, res: Response): Promise<void> {
  var hash = crypto.createHash('sha256').update("giberish").digest('hex');
  const dirpath = "UserData/" + hash + req.url;
  if(dirpath[-1] === '/'){
    res.status(409);
    res.send("PUT does not work with containers");
  }
  mkdirp.sync(path.dirname(dirpath));
  fs.writeFile(dirpath, req.body.toString('utf-8').toString() || "", function() {});
  res.status(201);
  res.send("Created");
}

export async function deleteFile(req: Request, res: Response) {
  var hash = crypto.createHash('sha256').update("giberish").digest('hex');
  const dirPath = "UserData/" + hash + req.url;
  const dirPathWellFormed = await fs.statSync(dirPath).isDirectory();
  if(dirPathWellFormed){
    fs.rmdir(dirPath, {recursive: true}, (err : any) => {
      if(!err){
        res.status(202);
        res.send("Ok")
      } else {
        res.status(402);
        res.send("Delete Failed :(")
      }
    });
  } else {
    fs.unlink(dirPath, (err : any) => {
      if(!err){
        res.status(202);
        res.send("Ok")
      }
    });
  }
}

export function fileAccessOptions (res: Response): void {
  res.writeHead(204, headers);
  res.end();
};