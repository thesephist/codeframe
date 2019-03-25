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
        border-right: 2px solid var(--cf-black);
        @media (max-width: ${MOBILE_WIDTH}px) {
            width: 100% !important;
            height: 50% !important;
            border-right: 0 !important;
            border-bottom: 2px solid var(--cf-black);
        }
        .urlBar {
            display: flex;
            flex-direction: row;
            width: 100%;
            padding: 0 3px;
            border-bottom: 4px dotted var(--cf-black);
            .inputContainer {
                box-sizing: content-box;
                flex-grow: 1;
                flex-shrink: 1;
            }
            input {
                display: block;
                font-size: .75rem;
                font-weight: bold;
                height: 100%;
                width: 100%;
                box-shadow: none;
                outline: none;
                border: 0;
                padding: 0;
                font-weight: normal;
                font-family: 'Menlo', 'Monaco', monospace;
            }
            a {
                font-size: .75rem;
                flex-grow: 0;
            }
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
                <div class="button inputContainer">
                    <input value="${url}" onfocus="${evt => evt.target.select()}" />
                </div>
                <a class="button" target="_blank" href="${url}" noreferer noopener>Preview</a>
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
        this.render();
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
        border-left: 2px solid var(--cf-black);
        @media (max-width: ${MOBILE_WIDTH}px) {
            width: 100% !important;
            height: 50% !important;
            border-left: 0 !important;
            border-top: 2px solid var(--cf-black);
        }
        .editorContainer {
            height: 100%;
            width: 100%;
            padding-top: 8px;
        }
        .top-bar {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 0 3px;
            border-bottom: 4px dotted var(--cf-black);
        }
        .tabs {
            display: flex;
            flex-direction: row;
            align-items: center;
        }
        .button {
            font-size: .75rem;
        }
        `;
    }

    compose() {
        return jdom`<div class="editor">
            <div class="top-bar">
                <div class="tabs">
                    <button
                        class="button ${this.mode === 'html' ? 'active' : ''} tab-html"
                        onclick="${() => this.switchMode('html')}">
                        HTML
                    </button>
                    <button
                        class="button ${this.mode === 'javascript' ? 'active' : ''} tab-js"
                        onclick="${() => this.switchMode('javascript')}">
                        JavaScript
                    </button>
                </div>
                <button class="button" onclick="${() => this.saveFrames()}">Save ${'&'} Reload</button>
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
        header {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 4px;
            background: var(--cf-background);
            border-bottom: 4px solid var(--cf-black);
            @media (max-width: ${MOBILE_WIDTH}px) {
                padding: 0 !important;
            }
        }
        nav {
            display: flex;
            flex-direction: row;
            flex-shrink: 1;
            overflow-x: auto;
        }
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
        .newButton {
            color: var(--cf-accent);
        }
        `;
    }

    compose() {
        return jdom`<div class="workspace">
            <header>
                <div class="logo">
                    <a class="button" href="/">Codeframe</a>
                </div>
                <nav>
                    <a class="button newButton" href="https://github.com/thesephist/codeframe" target="_blank">
                        New <span class="mobile-hidden">Codeframe</span>
                    </a>
                    <a class="button" href="https://twitter.com/thesephist" target="_blank">
                        <span class="mobile-hidden">Made by</span> @thesephist
                    </a>
                    <a class="button" href="https://github.com/thesephist/codeframe" target="_blank">
                        <span class="mobile-hidden">View Source on</span> Github
                    </a>
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
