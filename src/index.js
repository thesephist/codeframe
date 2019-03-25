const fs = require('fs');

const config = require('../config.js');

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.text({
    limit: '100kb',
}));

const api = require('./api.js');

// STATIC ASSETS
const STATIC_PATHS = {
    '/': 'index.html',
    '/new': 'editor.html',
    '/h/:htmlFrameHash/j/:jsFrameHash/edit': 'editor.html',
}
const respondWith = (res, static_path) => {
    fs.readFile(`static/${static_path}`, 'utf8', (err, data) => {
        if (err) {
            throw err;
        }

        res.set('Content-Type', 'text/html');
        res.set('X-Frame-Options', 'SAMEORIGIN');
        res.send(data);
    });
}
for (const [uri, path] of Object.entries(STATIC_PATHS)) {
    app.get(uri, (_req, res) => {
        try {
            respondWith(res, path);
        } catch (e) {
            console.error(e);
            // For now, assume it's a not-found error
            respondWith(res, '404.html');
        }
    });
}
app.use('/static', express.static('static'));

// API
const CONTENT_TYPES = {
    '.js': 'text/javascript',
    '.html': 'text/html',
}
const API_PATHS = {
    'GET /api/frame/:frameHash': api.frame.get,
    'POST /api/frame/': api.frame.post,

    'GET /f/:htmlFrameHash/:jsFrameHash.html': api.frame.getPage,
}
const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];
for (const [spec, handler] of Object.entries(API_PATHS)) {
    const [method, route] = spec.split(' ');
    let appMethod;
    if (METHODS.includes(method)) {
        appMethod = app[method.toLowerCase()].bind(app);
    } else {
        throw new Error(`Method ${method} for route ${route} is not valid`);
    }

    let contentType = 'application/json';
    for (const [ending, type] of Object.entries(CONTENT_TYPES)) {
        if (route.endsWith(ending)) {
            contentType = type;
        }
    }

    appMethod(route, async (req, res) => {
        try {
            res.set('Content-Type', contentType);
            res.set('X-Frame-Options', 'SAMEORIGIN');
            const result = await handler(req.params, req.query, req.body);
            if (typeof result === 'string') {
                res.send(result);
            } else {
                res.send(JSON.stringify(result));
            }
        } catch (e) {
            console.error(e);
            res.set('Content-Type', 'application/json');
            res.send(JSON.stringify({
                error: '500 Server Error',
            }));
        }
    });
}

// 404 last
app.use((_req, res) => respondWith(res, '404.html'));

app.listen(
    config.PORT,
    () => console.log(`Codeframe running on localhost:${config.PORT}`)
);
