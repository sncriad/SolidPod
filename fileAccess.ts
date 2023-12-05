const http = require('http');
var path = require('path');
const request = require('request');
const fs = require('fs');
const crypto = require('crypto');
const SolidAclParser = require('solid-acl-parser');
const { AclParser, Permissions, AclDoc, Agents} = SolidAclParser;
const { READ, WRITE, CONTROL, APPEND } = Permissions;
const potentialPerms = [READ, WRITE, CONTROL, APPEND];
const podOwner = "https://sncriado.solidcommunity.net/profile/card#me";
import { Request, Response } from 'express';
import W3CHeaders from './constants/defaultHeaders';
import { existsSync, readFileSync } from 'fs';
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
        if(!(path.extname(file) === ".acl")){
          // Construct turtle
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
        } }catch {
        console.log("No idea how this managed to happen;")
      }
    }
  );
  prefixes += "\n";
  resources += resources ? ";\n" : "";
  message = message + prefixes + toplevel + resources + "     stat:mtime " + stats.mtimeMs + ";\n" + "     stat:size " + stats.blksize + ".\n" + rest;
  return message;
}
async function hasPerms(dirname: string, webID : string, perms: any){
    const aclUrl = 'http://24.250.32.37:44444/' + dirname + ".acl";
    const fileUrl = 'http://24.250.32.37:44444/' + dirname;
    const parser = new AclParser({ aclUrl, fileUrl });
    let doc = await parser.turtleToAclDoc((await fs.readFileSync(dirname + '.acl')).toString());
    let permvalid = true;
    for(let i = 0; i < perms.length; i++){
      permvalid = permvalid && doc.hasRule(perms[i], webID);
    }
    return permvalid;
}

async function getPublicPerms(dirname: string){
  const aclUrl = 'http://24.250.32.37:44444/' + dirname + ".acl";
  const fileUrl = 'http://24.250.32.37:44444/' + dirname;
  const parser = new AclParser({ aclUrl, fileUrl });
  let doc = await parser.turtleToAclDoc((await fs.readFileSync(dirname + ".acl")).toString());
  let ret = [];
  const possible_perms = [READ, WRITE, CONTROL, APPEND];
  for(let i =0; i < possible_perms.length; i++){
    if(doc.hasRule(possible_perms[i], Agents.Public)){
      ret.push(possible_perms[i]);
    }
  }
  return ret;
}
// Dirname - Files to give ACL
// WebID - Used to give a specific webID perms - not used currently
// SuperPerms - perms to give public users as derived from above.
async function createACL(dirname: string, webId: string, superperms: any, userPerms : any = [READ]){
  // Verify that ACLCreation worsk for arbitrary
    if(dirname.slice(-1) === "/"){
      let segments = dirname.split('/')
      dirname = path.dirname(dirname) + "/" + segments[segments.length - 2];
    }
    const aclUrl = 'http://24.250.32.37:44444/' + dirname + ".acl";
    const fileUrl = 'http://24.250.32.37:44444/' + dirname;
    const parser = new AclParser({ aclUrl, fileUrl });
    const doc = new AclDoc({ accessTo: 'http://24.250.32.37:44444/' + dirname});
    // Give Public SuperPerms
    doc.addRule(superperms, Agents.PUBLIC);
    // Give admin full perms;
    doc.addRule([WRITE, CONTROL,APPEND, READ], podOwner);
    // Give creator their perms
    // doc.addRule(userPerms, webId);
    const newTurtle = await parser.aclDocToTurtle(doc);
    fs.writeFileSync(dirname + ".acl", newTurtle);
}
// Find last ACL for a folder, and return public perms + user perms
async function MostRecentACLPerms(dirpath: string, webID: string){
  let above = path.dirname(dirpath);
  while(above.length != 0){
    if(existsSync(above + ".acl")){
        const aclUrl = 'http://24.250.32.37:44444/' + above + ".acl";
        const fileUrl = 'http://24.250.32.37:44444/' + above;
        const parser = new AclParser({ aclUrl, fileUrl });
        let doc = await parser.turtleToAclDoc((await fs.readFileSync(above + ".acl")).toString());
        let ret = [];
        let userPerms = [];
        let rwca = []
        for(let i = 0; i < potentialPerms.length; i++){
          if(doc.hasRule(potentialPerms[i], Agents.public)){
            ret.push(potentialPerms[i]);
          }
          if(doc.hasRule(potentialPerms[i], webID)){
            userPerms.push(potentialPerms[i]);
          }
          ret.push(doc.hasRule(potentialPerms[i], webID));
        }
        return [ret, userPerms, ];
    } else {
      above = path.dirname(above);
    }
  }
}
export async function handleHead(req: Request, res: Response, webId : string) : Promise<any>{
  var hash = "topLevelFolder"
  const dirpath = "UserData/" + hash + req.url;
    // Check - Everyone can have a data folder, if you don't have one. then fix it.
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
    res.status(404)
  } finally { 
    res.setHeader("Content-Length", message.length.toString())
    res.send(message);
  }
}
export async function handleGet(req: Request, res: Response, webId : string) : Promise<any>{
  // At the moment, Get is open access. Anyone can access data.
  var hash = "topLevelFolder"
  const dirpath = "UserData/" + hash + req.url;
  let message : any = ""
  try{
    const stats = fs.statSync(dirpath);
    if(stats.isDirectory()) {
        message = await generateDirectorySimLDP(dirpath, hash, stats);
        res.status(200);
    } else {
        message = await readFileSync(dirpath);
        res.status(200);
    }
  } catch {
    message = "Requested File/Read ran into issues";
    res.status(409)
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
export async function handlePutRequest(req: Request, res: Response, webId: string): Promise<void> {
  var hash = "topLevelFolder"
  const slugfmt = req.headers.slug ? req.headers.slug + "/" : ''; 
  const dirpath = "UserData/" + hash + req.url + slugfmt;
  if(dirpath.indexOf('../') > -1){
    res.status(409);
    res.send("This server does not support ../ statements.");
    return;
  }
  mkdirp.sync(path.dirname(dirpath));
  if (dirpath.slice(-1) === "/"){
    let publicperms, userpemrs, pbool = await MostRecentACLPerms(dirpath, webId);
    let hasPerms = false;
    if(pbool[1]){
      await fs.mkdirSync(dirpath, { recursive: true });
      await createACL(dirpath, webId, publicperms, userpemrs);
    }
  } else {
    fs.writeFile(dirpath, req.body.toString('utf-8').toString() || "", function() {});
    await createACL(dirpath, webId, []);
  }
  res.status(201);
  res.send("Created");
}

export async function deleteFile(req: Request, res: Response, webId: string) {
  var hash = "topLevelFolder"
  const dirPath = "UserData/" + hash + req.url;
  const dirPathWellFormed = await fs.statSync(dirPath).isDirectory();
  if(dirPathWellFormed){
    let aclloc = dirPath.substring(0, dirPath.length - 1) + ".acl"
    fs.rmdir(dirPath, {recursive: true}, (err : any) => {
      if(err){
        res.status(402);
        res.send("Delete Failed :(")
      }
    });
    fs.unlink(aclloc, (err : any) => {
      if(!err){
        res.status(202);
        res.send("Ok")
      }
    });
  } else {
    fs.unlink(dirPath, (err : any) => {
      if(err){
        res.status(404);
        res.send("Something went wrong")
      }
    });
    fs.unlink(dirPath + ".acl", (err : any) => {
      if(!err){
        res.status(202);
        res.send("Ok")
      }
    });
  }
}
