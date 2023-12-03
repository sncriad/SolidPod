const http = require('http');
const request = require('request');
const fs = require('fs');
const crypto = require('crypto')
import { Request, Response } from 'express';
import W3CHeaders from './constants/defaultHeaders';

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
  toplevel += "     dct:modified " + '"' + stats.mtime.toJSON() + '"' + "^^xsd:dateTime;\n     ldp:contains\n";
  var rest = "";
  // Callback abomination
  const filenames = fs.readdirSync(dirpath);
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
  console.log
  message = message + prefixes + toplevel + resources + "     stat:mtime " + stats.mtimeMs + ";\n" + "     stat:size " + stats.blksize + ".\n" + rest;
  return message;
}
export async function handleGet(req: Request, res: Response, webId : string) : Promise<any>{
  var hash = crypto.createHash('sha256').update("giberish").digest('hex');
  const dirpath = "UserData/" + hash +"/";
  // TODO - Add dirpath formatting properly.
  // console.log(dirpath);
  let message = ""
  try{
    const stats = fs.statSync(dirpath);
    if(stats.isDirectory()) {
        message = generateDirectorySimLDP(dirpath, hash, stats);
        res.status(200);
     } else {
  
     }
  } catch {
    message = "Requested Filepath DNE";
  } finally { 
    res.send(message);
  }
}


function readFile(filename : string){
};

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
export async function createOrReplaceFile(req: Request, res: Response): Promise<void> {
  const dirPath = req.url;
  const slug = req.headers.slug;
  const link = req.headers.link;
  if (!slug || !link) {
    res.status(400).send("Slug and link headers required");
    return;
  }
  const dirPathWellFormed = await fs.statSync(dirPath).isDirectory(); 
  if (dirPathWellFormed) {
    const stuffToWrite = req.body;
    fs.writeFile('~/test_dir/test_file.txt', stuffToWrite);
  } else {
    res.status(400).send("URL must be a directory path");
  }
}

export async function deleteFile(req: Request, res: Response) {
  const dirPath = req.url;
  const slug = req.headers.slug;
  const link = req.headers.link;
  if (!slug || !link) {
    res.status(400).send("Slug and link headers required");
    return;
  }
  const dirPathWellFormed = await fs.statSync(dirPath).isDirectory(); 
  if (dirPathWellFormed) {
    var isDir = true;
    fs.stat(dirPath, (err: Error, stats: any) => {
      if (err) {
        res.status(400).send("Error deleting the directory");
        return;
      }
      if (stats.isFile()) {
        isDir = false;
      } else if (stats.isDirectory()) {
        isDir = true;
      } else {
        res.status(400).send("Error deleting the directory");
        return;
      }
    });
    var dirIsEmpty = isDir && (fs.readdirSync(dirPath).length === 0);
    // if empty or not dir:
    if (dirIsEmpty || !isDir) {
      fs.unlink(dirPath, (err: Error) => {
        if (err) {
          res.status(400).send("Error deleting file");
        } else {
          res.status(200).send("File deleted");
        }
    })}
    // else send error as specified
  } else {
    res.status(400).send("URL must be a directory path");
  }
}

export function fileAccessOptions (res: Response): void {
  res.writeHead(200, headers);
  res.end();
};