const {
    StyledComponent,
    ListOf,
    Record,
    StoreOf,
} = Torus;

class Todo extends Record {
    // Has 'complete', 'name' attributes
    toggle() {
        this.update({
            complete: !this.get('complete'),
        });
    }
}

const TodoStore = StoreOf(Todo);

class TodoItem extends StyledComponent {

    init(record) {
        this.bind(record, data => this.render(data));
    }

    styles() {
        return css`
        display: flex;
        flex-direction: row;
        align-items: center;
        input[type=checkbox] {
            margin-right: 12px;
        }
        `;
    }

    compose(data) {
        return jdom`<li>
            <input type="checkbox"
                onchange="${() => this.record.toggle()}"
                checked="${data.complete}"
                ></input>
            <p>${data.complete ? (
                    jdom`<strike>${data.name}</strike>`
                ) : (
                    data.name
                )}</p>
        </li>`;
    }

}

const TodoList = ListOf(TodoItem);

class App extends StyledComponent {

    init() {
        this.store = new TodoStore([
            new Todo({
                name: 'Finish building Codeframe',
                complete: false,
            }),
            new Todo({
                name: 'Always be on Twitter',
                complete: true,
            }),
        ]);
        this.list = new TodoList(this.store);

        this.inputVal = '';

        this.handleAddClick = this.handleAddClick.bind(this);
        this.handleInput = this.handleInput.bind(this);

        this.bind(this.store, data => this.render(data));
    }

    styles() {
        return css`
        font-family: system-ui, sans-serif;
        margin: 20px auto;
        max-width: 700px;
        box-sizing: border-box;
        padding: 0 4%;
        ul {
            padding-left: 0;
        }
        input {
            min-width: 200px;
        }
        button {
            margin-left: 12px;
            cursor: pointer;
        }
        `;
    }

    handleInput(evt) {
        this.inputVal = evt.target.value;
        this.render();
    }

    handleAddClick() {
        if (this.inputVal.trim() !== '') {
            this.store.create({
                name: this.inputVal.trim(),
                complete: false,
            });
        }
        this.inputVal = '';
        this.render();
    }

    compose(data) {
        return jdom`<main>
            <h1>${this.store.records.size} Todos</h1>
            <input type="text"
                oninput="${this.handleInput}"
                value="${this.inputVal}" />
            <button class="addButton"
                onclick="${this.handleAddClick}">Add to list</button>
            ${this.list.node}
        </main>`;
    }

}

const app = new App();
document.body.appendChild(app.node);
