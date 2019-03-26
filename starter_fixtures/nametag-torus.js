const {
    Styled,
    Component,
    StyledComponent,
} = Torus;

const NameTag = (first, last, company) => {
    return jdom`<div class="nameTag">
        <h1>${first}<br/>${last}</h1>
        <hr/>
        <div class="companyName">${company}</div>
    </div>`;
}

class StyledNT extends Styled(Component.from(NameTag)) {
    styles() {
        return css`
        border: 4px solid #333;
        border-radius: 6px;
        box-shadow: 0 3px 8px rgba(0, 0, 0, .4);
        padding: 16px;
        color: #333;
        background: #62e6e0;
        width: 100%;
        max-width: 360px;
        box-sizing: border-box;
        margin: 0 auto 24px auto;
        transform: perspective(110px) rotateX(5deg) scale(.9);
        transition: transform .3s;
        cursor: pointer;
        h1 {
            margin: 0;
            margin-bottom: 12px;
        }
        hr {
            border: 0;
            border-bottom: 4px solid #333;
            margin-bottom: 8px;
        }
        &:hover {
            transform: perspective(90px) rotateX(0deg) scale(1);
        }
        `;
    }
}

class App extends StyledComponent {

    init() {
        this.firstNameVal = 'Johnny';
        this.lastNameVal = 'Appleseed';
        this.companyVal = 'Codeframe Inc';

        this.handleFirstNameChange = this.handleFirstNameChange.bind(this);
        this.handleLastNameChange = this.handleLastNameChange.bind(this);
        this.handleCompanyChange = this.handleCompanyChange.bind(this);
    }

    styles() {
        return css`
        font-family: system-ui, sans-serif;
        max-width: 600px;
        width: 92%;
        margin: 20px auto;
        .inputGroup {
            text-align: center;
            margin-top: 8px;
        }
        label {
            margin-right: 12px;
            font-weight: bold;
        }
        input {
            padding: 4px 8px;
            font-size: 1rem;
        }
        `;
    }

    handleFirstNameChange(evt) {
        this.firstNameVal = evt.target.value;
        this.render();
    }

    handleLastNameChange(evt) {
        this.lastNameVal = evt.target.value;
        this.render();
    }

    handleCompanyChange(evt) {
        this.companyVal = evt.target.value;
        this.render();
    }

    compose() {
        return jdom`<main>
            ${new StyledNT(
                this.firstNameVal,
                this.lastNameVal,
                this.companyVal
            ).node}
            <div class="inputGroup">
                <label for="firstNameInput">First name</label>
                <input id="firstNameInput"
                    type="text"
                    value="${this.firstNameVal}"
                    oninput="${this.handleFirstNameChange}"/>
            </div>
            <div class="inputGroup">
                <label for="lastNameInput">Last name</label>
                <input id="lastNameInput"
                    type="text"
                    value="${this.lastNameVal}"
                    oninput="${this.handleLastNameChange}"/>
            </div>
            <div class="inputGroup">
                <label for="companyInput">Company/school</label>
                <input id="companyInput"
                    type="text"
                    value="${this.companyVal}"
                    oninput="${this.handleCompanyChange}"/>
            </div>
        </main>`;
    }

}

const app = new App();
document.body.appendChild(app.node);
