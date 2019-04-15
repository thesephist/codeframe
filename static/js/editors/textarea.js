//> This is a reference implementation of the `EditorCore` interface that
//  allows any third-party editor to be plugged into Codeframe as the code
//  editor of choice. `TextAreaEditor` is backed by a simple `<textarea>` element.
class TextAreaEditor {

    constructor(callback) {
        this.mode = 'html';

        //> When the file contents are not being edited, they are cached in
        //  `this.frames`.
        this.frames = {
            html: '',
            javascript: '',
        }

        this.container = document.createElement('textarea');
        this.container.classList.add('editorContainer');

        //> Attach some basic event handlers to allow correct
        //  indentation with tabs (4 spaces, for consistency).
        this.container.addEventListener('keydown', evt => {
            if (evt.key === 'Tab') {
                //> By default, the tab key will lead the user to go the
                //  next element in the tab-index order.
                evt.preventDefault();

                const tgt = evt.target;
                if (evt.shiftKey) {
                    const idx = tgt.selectionStart;
                    if (idx !== null) {
                        let front = tgt.value.substr(0, idx);
                        const back = tgt.value.substr(idx);
                        let diff = 0;
                        //> If dedenting, remove any whitespace up to 4 spaces
                        //  in front of the cursor.
                        while (front.endsWith(' ') && diff < 4) {
                            front = front.substr(0, front.length - 1);
                            tgt.value = front + back;
                            diff ++;
                        }
                        //> Rendering the new input value will
                        //  make us lose focus on the textarea, so we put the
                        //  focus back by selecting the area the user was just editing.
                        tgt.setSelectionRange(idx - diff, idx - diff);
                    }
                } else {
                    const idx = tgt.selectionStart;
                    if (idx !== null) {
                        const front = tgt.value.substr(0, idx);
                        const back = tgt.value.substr(idx);
                        //> If indenting, just add 4 spaces at the position of the cursor.
                        tgt.value = front + '    ' + back;
                        //> Rendering the new input value will
                        //  make us lose focus on the textarea, so we put the
                        //  focus back by selecting the area the user was just editing.
                        tgt.setSelectionRange(idx + 4, idx + 4);
                    }
                }
            }
        });

        //> Set the first file editing mode ('html')
        this.setMode(this.mode);

        //> This is a trick to get around the asynchrony requirement
        //  for the callback. (Promise callbacks are executed in the microtask
        //  queue, not immediately.) This is required because Codeframe's editor
        //  component assumes that this callback is called after the editor is
        //  instantiated, so a synchronous callback in the constructor doesn't work.
        Promise.resolve().then(() => {
            callback(this);
        });
    }

    getValue(mode = this.mode) {
        if (mode === this.mode) {
            return this.container.value;
        } else {
            return this.frames[mode];
        }
    }

    setValue(value, mode = this.mode) {
        if (mode === this.mode) {
            this.container.value = value;
        } else {
            this.frames[mode] = value;
        }
    }

    getMode() {
        return this.mode;
    }

    setMode(mode) {
        //> Persist the current editor value to memory first
        this.frames[this.mode] = this.container.value;

        this.mode = mode;
        this.container.value = this.frames[this.mode];
    }

    addChangeHandler(handler) {
        this.container.addEventListener('input', handler);
    }

    getContainer() {
        return this.container;
    }

    resize() {
        // no-op
    }

    ready() {
        //> Since the text area editor is synchronously initialized,
        //  it is always "ready" to be used.
        return true;
    }

}
