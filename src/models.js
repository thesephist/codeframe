const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const config = require('../config.js');

const hashFile = contents => {
    const hash = crypto.createHash('sha256');
    hash.update(contents);
    // first 12 chars of the hex digest
    return 'cf_' + hash.digest('base64').substr(0, 12);
}

class SourceFileStore {

    constructor(basePath) {
        this.basePath = basePath;
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath);
        }
    }

    getHashedFilePath(contents) {
        return path.join(this.basePath, `${hashFile(contents)}.frame`);
    }

    has(sourceFilePath) {
        return new Promise((res, _rej) => {
            fs.access(sourceFilePath, fs.constants.R_OK, err => {
                res(!err);
            });
        });
    }

    getFromFS(sourceFilePath) {
        return new Promise((res, rej) => {
            fs.readFile(sourceFilePath, (err, data) => {
                if (err) {
                    rej(err);
                } else {
                    res(data);
                }
            });
        });
    }

    async create(sourceFileContents) {
        const frameHash = hashFile(sourceFileContents);
        const sourceFilePath = this.getHashedFilePath(sourceFileContents);
        const exists = await this.has(sourceFilePath);
        if (!exists) {
            return new Promise((res, rej) => {
                fs.writeFile(sourceFilePath, sourceFileContents, 'utf8', err => {
                    if (err) {
                        rej(err)
                    } else {
                        res(frameHash);
                    }
                });
            });
        }
        return frameHash;
    }

}

const store = new SourceFileStore(config.DATABASE);

module.exports = {
    store,
}
