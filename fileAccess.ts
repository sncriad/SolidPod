const http = require('http');
const request = require('request');
const fs = require('fs');
import express, { Request, Response } from 'express';

const headers = {
  'Allow': 'GET, HEAD, OPTION', 
  'Accept-Patch': 'application/text', 
  'Accept-Put': 'application/text', 
  'Accept-Post': 'application/text'
}

// Receive a get request to read a file, return the info in that file
export function readFile(req: Request, res: Response): void {
  // determine if successful request (step 3) 
  // QUESTION: what does a successful request even look like?? If auth, we need conditional in main
  // TODO: determine if request is well-formed
  //       what field will the req's file path be in?
  //       transfer logic to writeFile as well
  // Format for a response
  // Header: Access (GET HEAD OPTIONS, but GET for now)
  //         Allow: 'text/html'???
  //         Accept-Patch, Accept-Put, Accept-Post
  const dirPath = req.url;
  const slug = req.headers.slug;
  const link = req.headers.link;
  if (!slug || !link) {
    res.status(400).send("Slug and link headers required");
    return;
  }
  const dirPathWellFormed = fs.statSync(dirPath).isDirectory(); // Vaguely concerned about this being asynchronous?? (https://www.tabnine.com/code/javascript/functions/fs/Stats/isDirectory?snippet=5f64d832f93c3aaf60e3102c)
  if (dirPathWellFormed) {
    res.writeHead(200, headers);
    // File format (step 2)
    const data = fs.readFileSync('~/test_dir/test_file.txt', { encoding: 'utf8', flag: 'r' });
    // Writing the data to the *response*
    res.write(data);
    res.end();
  } else {
    res.status(400).send("URL must be a directory path");
  }
};

export function editFile(req: Request, res: Response): void {
  const dirPath = req.url;
  const slug = req.headers.slug;
  const link = req.headers.link;
  if (!slug || !link) {
    res.status(400).send("Slug and link headers required");
    return;
  }
  const dirPathWellFormed = fs.statSync(dirPath).isDirectory(); 
  if (dirPathWellFormed) {
    res.writeHead(200, headers);
    const stuffToWrite = "texty-text! " // TEMP DATA, get it from the request eventually
    fs.appendFileSync(dirPath, stuffToWrite);
  } else {
    res.status(400).send("URL must be a directory path");
  }
};

// for post and put requests
export function createOrReplaceFile(req: Request, res: Response): void {
  const dirPath = req.url;
  const slug = req.headers.slug;
  const link = req.headers.link;
  if (!slug || !link) {
    res.status(400).send("Slug and link headers required");
    return;
  }
  const dirPathWellFormed = fs.statSync(dirPath).isDirectory(); 
  if (dirPathWellFormed) {
    const stuffToWrite = req.body;
    fs.writeFileSync('~/test_dir/test_file.txt', stuffToWrite);
  } else {
    res.status(400).send("URL must be a directory path");
  }
}

export function fileAccessOptions (res: Response): void { // QUESTION: this *is* what the options method is suppsoed to do, right?
  res.writeHead(200, headers);
  res.end();
};
