const http = require('http');
const request = require('request');
const fs = require('fs');
import { Request, Response } from 'express';

const headers = {
  'Allow': 'GET, HEAD, OPTION', 
  'Accept-Patch': 'application/text', 
  'Accept-Put': 'application/text', 
  'Accept-Post': 'application/text'
}

export async function readFile(req: Request, res: Response): Promise<void> {
  const dirPath = req.url;
  const slug = req.headers.slug;
  const link = req.headers.link;
  if (!slug || !link) {
    res.status(400).send("Slug and link headers required");
    return;
  }
  const dirPathWellFormed = await fs.statSync(dirPath).isDirectory(); 
  if (dirPathWellFormed) {
    res.writeHead(200, headers);
    const data = fs.readFile('~/test_dir/test_file.txt', { encoding: 'utf8', flag: 'r' });
    res.write(data);
    res.end();
  } else {
    res.status(400).send("URL must be a directory path");
  }
};

export async function editFile(req: Request, res: Response): Promise<void> {
  const dirPath = req.url;
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