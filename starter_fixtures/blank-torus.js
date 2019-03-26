const {
    StyledComponent,
} = Torus;

class App extends StyledComponent {

    styles() {
        return css`
        font-family: system-ui, sans-serif;
        `;
    }

    compose() {
        return jdom`<h1>Hello, Torus!</h1>`;
    }

}

const app = new App();
document.body.appendChild(app.node);
