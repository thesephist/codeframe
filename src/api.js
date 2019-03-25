const {store} = require('./models.js');

const api = {
    frame: {},
}

api.frame.get = params => {
    return store.getFromFS(params.frameHash);
}

api.frame.post = async (_params, _query, body) => {
    const frameHash = await store.create(body);
    return frameHash;
}

module.exports = api;
