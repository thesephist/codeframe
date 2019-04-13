//> This file defines the few Codeframe-internal API endpoints

const {store} = require('./models.js');

//> This is the object that will contain all API methods for frames.
const api = {
    frame: {},
}

//> `frame.get` allows to get a Codeframe file, given a hash
api.frame.get = params => {
    return store.getFromFS(params.frameHash);
}

//> `frame.post` lets us create a new frame, and returns the hash generated.
api.frame.post = async (_params, _query, body) => {
    const frameHash = await store.create(body);
    return frameHash;
}

//> `frame.getPage` renders a full Codeframe page from two hashes, one for
//  each of HTML and JS files. This is the "preview" page.
api.frame.getPage = async params => {
    const htmlFrame = await store.getFromFS(params.htmlFrameHash);
    const jsFrame = await store.getFromFS(params.jsFrameHash);
    return `<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <title>Live Frame | Codeframe</title>
    </head>
    <body>
        ${htmlFrame}
        <script src="https://unpkg.com/torus-dom/dist/index.min.js"></script>
        <script>${jsFrame}</script>
    </body>
</html>`;
}

module.exports = api;
