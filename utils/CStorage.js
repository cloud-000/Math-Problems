class CStorage {
    static #storage = {}
    static #identifer = document.location.href
    static init() {
        if (localStorage.getItem(this.#identifer) === null) {
            this.#update()
        } else {
            this.#storage = JSON.parse(localStorage.getItem(this.#identifer))
        }
    }
    static clear() {
        this.#storage = {}
        this.#update()
    }
    static setItem(key, value) {
        this.#storage[key] = value
        this.#update()
    }
    static removeItem(key) {
        delete this.#storage[key]
        this.#update()
    }
    static getItem(key) {
        return this.#storage[key]
    }
    static #update() {
        localStorage.setItem(this.#identifer, JSON.stringify(this.#storage))
    }
}