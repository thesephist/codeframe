const {
    StyledComponent,
    Router,
} = Torus;

const cfFetch = (uri, options) => {
    return fetch(uri, {
        credentials: 'same-origin',
        cache: 'no-cache',
        ...options,
    });
}

const api = {
    get: path => cfFetch(`/api${path}`, {
        method: 'GET',
    }),
    post: (path, body) => cfFetch(`/api${path}`, {
        method: 'POST',
        body: body,
    }),
}

class App extends StyledComponent {

    compose() {
        return jdom`<h1>editor</h1>`;
    }

}

const router = new Router({
    default: '/',
});

const app = new App(router);
document.body.appendChild(app.node);
