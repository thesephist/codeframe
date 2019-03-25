const {
    StyledComponent,
    Record,
    Router,
} = Torus;

const TEST_HASH = 'tHcltW+0gIR7';

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

const PreviewPane = (htmlFrameHash, jsFrameHash) => {
    return jdom`<iframe
    style="
        height: 100%;
        width: 100%;
        flex-grow: 1;
    "
    src="/f/${htmlFrameHash}/${jsFrameHash}.html"
    />`;
}

class Editor extends StyledComponent {

    init(frameRecord) {
        this.mode = '';
        this.frames = {
            html: '<h1>\n\tHello, World!\n</h1>',
            javascript: `console.log('Hello, World!');`,
        }
        this.initMonaco();
        this.switchMode('html');

        this.bind(frameRecord, data => this.render(data));
    }

    initMonaco() {
        this.monacoContainer = document.createElement('div');
        this.monacoContainer.classList.add('editorContainer');
        require.config({
            paths: {
                vs: 'https://unpkg.com/monaco-editor/min/vs',
            },
        });
        require(['vs/editor/editor.main'], () => {
            this.monacoEditor = monaco.editor.create(this.monacoContainer, {
                language: this.mode,
                value: this.frames[this.mode],
            });
            this.monacoEditor.layout();
        });
    }

    switchMode(mode) {
        if (this.monacoEditor) {
            this.frames[this.mode] = this.monacoEditor.getValue();
        }
        this.mode = mode;
        if (this.monacoEditor) {
            monaco.editor.setModelLanguage(this.monacoEditor.getModel(), mode);
            this.monacoEditor.setValue(this.frames[mode]);
        }
    }

    async saveFrames() {
        this.frames[this.mode] = this.monacoEditor.getValue();
        const hashes = {
            html: '',
            js: '',
        }
        await Promise.all([
            api.post(`/frame/`, this.frames.html).then(resp => {
                return resp.text();
            }).then(hash => hashes.html = hash),
            api.post(`/frame/`, this.frames.javascript).then(resp => {
                return resp.text();
            }).then(hash => hashes.js = hash),
        ]);
        router.go(`/h/${hashes.html}/j/${hashes.js}/edit`);
    }

    styles() {
        return css`
        height: 100%;
        width: 100%;
        flex-grow: 1;
        .editorContainer {
            height: 100%;
            width: 100%;
        }
        .top-bar {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
        }
        `;
    }

    compose(data) {
        return jdom`<div class="editor">
            <div class="top-bar">
                <div class="tabs">
                    <button class="tab-html" onclick="${() => this.switchMode('html')}">HTML</button>
                    <button class="tab-js" onclick="${() => this.switchMode('javascript')}">JAVASCRIPT</button>
                </div>
                <button onclick="${() => this.saveFrames()}">Save</button>
            </div>
            ${this.monacoContainer}
        </div>`;
    }

}

class Workspace extends StyledComponent {

    init(frameRecord) {
        this.editor = new Editor(frameRecord);

        this.bind(frameRecord, data => this.render(data));
    }

    styles() {
        return css`
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        main {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-start;
            flex-grow: 1;
            overflow: hidden;
        }
        `;
    }

    compose(data) {
        return jdom`<div class="workspace">
            <header>
                <div class="logo">
                    <a href="/">Codeframe</a>
                </div>
            </header>
            <main>
                ${PreviewPane(data.htmlFrameHash, data.jsFrameHash)}
                ${this.editor.node}
            </main>
        </div>`;
    }

}

class App extends StyledComponent {

    init(router) {
        this.frameRecord = new Record({
            htmlFrameHash: '',
            jsFrameHash: '',
        });
        this.workspace = new Workspace(this.frameRecord);

        this.bind(router, ([name, params]) => {
            switch (name) {
                case 'edit':
                    this.frameRecord.update({
                        htmlFrameHash: params.htmlFrameHash,
                        jsFrameHash: params.jsFrameHash,
                    });
                    break;
                default:
                    // open blank files?
                    router.go(`/h/${TEST_HASH}/j/${TEST_HASH}/edit`);
                    break;
            }
        })
    }

    styles() {
        return css`
        width: 100%;
        height: 100vh;
        `;
    }

    compose() {
        return jdom`<div id="root">
            ${this.workspace.node}
        </div>`;
    }

}

const router = new Router({
    edit: '/h/:htmlFrameHash/j/:jsFrameHash/edit',
    default: '/new',
});

const app = new App(router);
document.body.appendChild(app.node);
