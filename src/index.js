const fs = require('fs');

const config = require('../config.js');

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.text({
    limit: '50kb',
}));

const api = require('./api.js');

const CONTENT_TYPES = {
    '.js': 'text/javascript',
    '.html': 'text/html',
    '.ico': 'image/x-icon',
}

// STATIC ASSETS
const STATIC_PATHS = {
    '/': 'index.html',

    // Editor alias routes
    '/new': 'editor.html',
    '/welcome': 'editor.html',

    '/favicon.ico': 'assets/favicon.ico',
    '/h/:htmlFrameHash/j/:jsFrameHash/edit': 'editor.html',
}
const respondWith = (res, static_path) => {
    fs.readFile(`static/${static_path}`, (err, data) => {
        if (err) {
            throw err;
        }

        //> We determine the content-type based on requested resource file ending,
        //  and fall back to HTML.
        let contentType = 'text/html';
        for (const [ending, type] of Object.entries(CONTENT_TYPES)) {
            if (static_path.endsWith(ending)) {
                contentType = type;
                break;
            }
        }

        res.set('Content-Type', contentType);
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

//> Easily redirect `/f/*.html/edit` to an editor view
//  to edit statically rendered Codeframes by just appending `/edit` to the URL.
app.get('/f/:htmlFrameHash/:jsFrameHash.html/edit', (req, res) => {
    res.redirect(302, `/h/${req.params.htmlFrameHash}/j/${req.params.jsFrameHash}/edit`);
});

// API
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

    //> We determine the content-type based on requested resource file ending,
    //  and fall back to JSON.
    let contentType = 'application/json';
    for (const [ending, type] of Object.entries(CONTENT_TYPES)) {
        if (route.endsWith(ending)) {
            contentType = type;
            break;
        }
    }

    appMethod(route, async (req, res) => {
        try {
            res.set('Content-Type', contentType);
            const result = await handler(req.params, req.query, req.body);
            if (typeof result === 'string') {
                res.send(result);
            } else {
                res.send(JSON.stringify(result));
            }
        } catch (e) {
            console.error(e);
            res.send('error');
        }
    });
}

// 404 last
app.use((_req, res) => respondWith(res, '404.html'));

app.listen(
    config.PORT,
    () => console.log(`Codeframe running on localhost:${config.PORT}`)
);
