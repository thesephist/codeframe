const {
    Styled,
    Component,
    StyledComponent,
    Router,
} = Torus;

class App extends StyledComponent {

    compose() {
        return jdom`<h1>hi</h1>`;
    }

}

const router = new Router({
    default: '/',
});

const app = new App(router);
document.body.appendChild(app.node);
