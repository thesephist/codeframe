//> This file contains all logic for managing the filesystem
//  backed database of Codeframe files.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

const config = require('../config.js');

//> These files are Codeframe files that must be ensured to exist
//  in the database with every deploy, since they're used in demos
//  on the home page. These are checked for existence later.
const STARTER_FIXTURES = [
    'blank-torus.js',
    'blank.frame',
    'button-effects.html',
    'canvas.js',
    'filters-shadows.html',
    'flexbox.html',
    'helloworld.html',
    'helloworld.js',
    'simple-blog.html',
    'interactive-input.html',
    'interactive-input.js',
    'nametag-torus.js',
    'see-javascript.html',
    'todo-torus.js',
];

//> Utility method to get a trimmed sha256 hash of a string.
const hashFile = contents => {
    const hash = crypto.createHash('sha256');
    hash.update(contents);
    // first 12 chars of the hex digest
    return hash.digest('hex').substr(0, 12);
}

//> `SourceFileStore` is the database that manages the app's communication
//  with the filesystem-backed storage for Codeframe files. For efficiency of data in storage,
//  we compress files stored here with gzip for on-disk storage.
class SourceFileStore {

    constructor(basePath) {
        this.basePath = basePath;
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath);
        }
        //> The first time the file store is created, we make sure each of the required
        //  demo snippets exists.
        for (const fxt of STARTER_FIXTURES) {
            fs.readFile(`starter_fixtures/${fxt}`, 'utf8', (err, data) => {
                if (err) {
                    console.error(err);
                } else {
                    this.create(data);
                }
            });
        }
    }

    getPathFromHash(hash) {
        return path.join(this.basePath, `cf_${hash}.frame`);
    }

    getHashedFilePath(contents) {
        return this.getPathFromHash(hashFile(contents));
    }

    has(sourceFilePath) {
        return new Promise((res, _rej) => {
            fs.access(sourceFilePath, fs.constants.R_OK, err => {
                res(!err);
            });
        });
    }

    //> Given a hash, returns a Promise resolving to the contents of the file, or rejects.
    getFromFS(frameHash) {
        return new Promise((res, rej) => {
            fs.readFile(this.getPathFromHash(frameHash), (err, data) => {
                if (err) {
                    rej(err);
                } else {
                    //> unzip gzip compression of the read data before returning
                    //  to the caller
                    zlib.gunzip(data, 'utf8', (err, results) => {
                        if (err) {
                            rej(err);
                        } else {
                            res(results.toString('utf8'));
                        }
                    });
                }
            });
        });
    }

    //> First check if the file we're looking to create exists, and if not, create one.
    async create(sourceFileContents) {
        const frameHash = hashFile(sourceFileContents);
        const sourceFilePath = this.getHashedFilePath(sourceFileContents);
        const exists = await this.has(sourceFilePath);
        if (!exists) {
            return new Promise((res, rej) => {
                //> Before saving the file, gzip the text file
                zlib.gzip(sourceFileContents, 'utf8', (err, results) => {
                    if (err) {
                        rej(err);
                    } else {
                        fs.writeFile(sourceFilePath, results, err => {
                            if (err) {
                                rej(err)
                            } else {
                                res(frameHash);
                            }
                        });
                    }
                });
            });
        }
        return frameHash;
    }

}

//> Create a new database from the class, and export that for use.
const store = new SourceFileStore(config.DATABASE);

module.exports = {
    store,
}
