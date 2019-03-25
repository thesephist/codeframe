const {
    StyledComponent,
    Record,
    Router,
} = Torus;

const BLANK_HASH = 'e3b0c44298fc';

const MOBILE_WIDTH = 750;

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

class PreviewPane extends StyledComponent {

    init(frameRecord) {
        this.bind(frameRecord, data => this.render(data));
    }

    styles() {
        return css`
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: flex-start;
        height: 100%;
        width: 50%;
        flex-grow: 1;
        flex-shrink: 1;
        overflow: hidden;
        @media (max-width: ${MOBILE_WIDTH}px) {
            width: 100% !important;
            height: 50% !important;
        }
        .urlBar {
            height: 36px;
        }
        iframe {
            height: 100%;
            width: 100%;
            flex-grow: 1;
            outline: none;
            border: 0;
            box-shadow: none;
        }
        `;
    }

    compose(data) {
        const url = `${window.location.origin}/f/${data.htmlFrameHash}/${data.jsFrameHash}.html`;
        return jdom`<div class="previewPanel">
            <div class="urlBar">
                <a target="_blank" href="${url}" noreferer noopener>${url}</a>
            </div>
            <iframe src=${url} />
        </div>`;
    }

}

class Editor extends StyledComponent {

    init(frameRecord) {
        this.mode = 'html';
        this.frames = {
            html: '',
            javascript: ``,
        }
        this.initMonaco();

        this.bind(frameRecord, data => {
            this.fetchFrames(data);
            this.render(data);
        });

        this.resizeEditor = this.resizeEditor.bind(this);
        window.addEventListener('resize', this.resizeEditor);
    }

    remove() {
        window.removeEventListener('resize', this.resizeEditor)
    }

    fetchFrames(data) {
        if (!this._framesFetched) {
            if (data.htmlFrameHash) {
                api.get(`/frame/${data.htmlFrameHash}`).then(resp => {
                    return resp.text();
                }).then(result => this.frames.html = result);
                api.get(`/frame/${data.jsFrameHash}`).then(resp => {
                    return resp.text();
                }).then(result => this.frames.javascript = result);
                this._framesFetched = true;
            }
        }
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

    resizeEditor() {
        this.monacoEditor.layout();
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
        width: 50%;
        flex-grow: 1;
        flex-shrink: 1;
        overflow: hidden;
        @media (max-width: ${MOBILE_WIDTH}px) {
            width: 100% !important;
            height: 50% !important;
        }
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

    compose() {
        return jdom`<div class="editor">
            <div class="top-bar">
                <div class="tabs">
                    <button class="tab-html" onclick="${() => this.switchMode('html')}">HTML</button>
                    <button class="tab-js" onclick="${() => this.switchMode('javascript')}">JAVASCRIPT</button>
                </div>
                <button onclick="${() => this.saveFrames()}">Save ${'&'} Reload</button>
            </div>
            ${this.monacoContainer}
        </div>`;
    }

}

class Workspace extends StyledComponent {

    init(frameRecord) {
        this.preview = new PreviewPane(frameRecord);
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
            @media (max-width: ${MOBILE_WIDTH}px) {
                flex-direction: column !important;
            }
        }
        header {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
        }
        `;
    }

    compose() {
        return jdom`<div class="workspace">
            <header>
                <div class="logo">
                    <a href="/">Codeframe</a>
                </div>
                <nav>
                    <a href="https://github.com/thesephist/codeframe" target="_blank">on Github</a>
                </nav>
            </header>
            <main>
                ${this.preview.node}
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
                    router.go(`/h/${BLANK_HASH}/j/${BLANK_HASH}/edit`);
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
