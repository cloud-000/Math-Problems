class ManageState {
    #states = {}
    #curr = null
    constructor(t) {this.main = t, this.on_change = null}
    renameState(o, n) {
        this.#states[n] = this.#states[o]
        delete this.#states[o]
    }
    deleteState(n) {
        this.#states[n].destroy()
        if (this.#curr) {
            if (this.#curr.name == n) {
                this.#curr = null
            }
        }
        delete this.#states[n]
    }
    createState(s, name) {this.#states[name] = s}
    setState(name) {
        if (this.on_change) {
            this.on_change(name)
        }
        if (this.#curr != null && this.#curr.exit(), null===name) {
            this.#curr = null;return
        }
        this.#states[name].enter(), this.#curr = this.#states[name]
    }
    resize() {this.#curr&&this.#curr.resize()}
    getState(name) { return this.#states[name] }
    get state() { return this.#curr }
    get states() { return Object.values(this.#states) }
}

class State{constructor(e){this.manager=e}contextmenu(e){}enter(){}exit(){}resize(){}}

// main state? like sets, problems, stats, and log idk bruh
class MState extends State {
    constructor(m) {
        super(m)
        this.element = UI.element("div", {class: "flex expand"})
    }

    init(name, button) {
        this.name = name
        this.button = button
        this.button.onclick = () => {
            if (this.manager.state?.name === this.name) {
                return;
            }
            this.manager.setState(this.name)
        }
    }

    enter() {
        super.enter()
        this.button.setAttribute("active", true)
        htmlAdd(this.element, this.manager.element)
    }

    exit() {
        super.exit()
        this.button.removeAttribute("active")
        this.element.remove()
    }
}