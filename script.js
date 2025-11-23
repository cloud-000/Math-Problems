const FIXED = {
    B_TYPES: {
        DEFAULT: "default",
        ACT: "act",
        NAV: "nav"
    },
    svgNS: "http://www.w3.org/2000/svg"
}

function main() {
    CStorage.init()
    UI.default()
    const MAIN = new Main()
    Editable.latex = document.querySelector("#latex-menu")
    Editable.delete = UI.precomp("button", {type: FIXED.B_TYPES.DEFAULT, icon: "delete"})
    htmlAdd(Editable.delete, Editable.latex.children[1])
    Editable.init()    
    MAIN.init()
    MAIN.start()
}

function namedStringFormat(template, replacements) {
    return template.replace(/{(.*?)}/g, (match, key) =>
        typeof replacements[key] !== 'undefined' ? replacements[key] : match
    );
}

function combineFunctions(...funcs) {return function() {funcs.forEach(_fn => _fn());}}

class Main {
    constructor() {
        this.e = {
            wrapper: document.querySelector("main"),
            sidebarContainer: document.querySelector("#sidebar-container"),
            navContainer: document.querySelector("#nav-container"),
            navButton: document.querySelector("#nav-buttons")
        }
        this.manager = new ManageState(this)
        this.timing = {duration: 250, iterations: 1, easing: "ease"}
        this.navOpen = true
        this.pContextMenu = new CContextMenu([
            {text: "Edit", icon: "edit"},
            // {text: "Type", icon: "category", submenu: [{text: "answer"}, {text: "multiple choice"}]},
            {text: "Expand", icon: "open_in_full", onclick: () => this.manager.getState("problem").action(ProblemState.ACTION.EXPAND)},
            {text: "Delete", icon: "delete"}
        ])
        this.pContextMenu.init()
    
        this.holdy = UI.element("div", {style: "position: absolute; display: none; width: fit-content; height: fit-content"})
        htmlAdd(this.holdy, document.body)

        this.typeDropdown = new CDropdownMenu([
            {text: "Algebra", icon: {href: "algebra-symbol"}, value: "A"},
            {text: "Geometry", value: "G"},
            {text: "Combinatorics", value: "C"},
            {text: "Number Theory", value: "N"},
            {text: "Arithmetic", value: "Arithmetic"}
        ])
        this.typeDropdown.init("typeasdf")
        this.typeDropdown.link(this.holdy)

        this.difficultyDropdown = new CDropdownMenu([
            {text: "Very Easy", value: 0},
            {text: "Easy", value: 1},
            {text: "Normal", value: 2},
            {text: "Hard", value: 3},
            {text: "Very Hard", value: 4}
        ], false)
        this.difficultyDropdown.init("hardnessasdf")
        this.difficultyDropdown.link(this.holdy)
    }
    
    init() {
        Theme.storeTheme(new Theme("plain", {
            "c bg": "rgb(255, 255, 255)",
            "c bg m": "rgb(244, 246, 248)",
            "c text": "rgb(9, 9, 11)",
            "c text2": "rgb(113, 113, 122)",
            "c bd": "rgb(208, 217, 224)",
            "c shadow": "rgb(103 103 120 / 30%)",
            "c accent": "rgb(50, 108, 236)",
            "c accent bg": "rgb(219, 233, 254)"
            
        }))
        Theme.theme = "plain"
        this.manager.element = this.e.wrapper.children[1]
    }

    state(name, state, text, i) {
        let b = UI.precomp("button", {icon: i, type: FIXED.B_TYPES.NAV, html: {style: "width: 100%; justify-content: flex-start"}})
        htmlAdd(UI.element("span", {}, {textContent: text}), b)
        state.init(name, b)
        this.manager.createState(state, name)
        htmlAdd(b, this.e.navContainer.children[0])
        b = null
    }

    start() {
        this.navToggle = UI.precomp("button", {icon: "chevron_left", html: {style: "padding: 6px; transform: translateX(-50%)"}, 
        js: {onclick: () => {this.toggle()}}})
        this.navToggle.children[0].style.setProperty("transition", "rotate 0.2s ease")

        this.state("set", new ProblemSetState(this.manager), "Sets", "topic")
        this.state("problem", new ProblemState(this.manager), "Problems", "category")
        this.state("stats", new MState(this.manager), "Stats", "monitoring")
        this.state("log", new MState(this.manager), "Log", "list_alt")

        htmlAdd(this.navToggle, this.e.navButton)

        this.manager.setState("set")
    }

    toggle() {
        this.navOpen = !this.navOpen
        if (this.navOpen) {this.nOpen()} else {this.nClose()}
    }
    nOpen() {
        this.e.navContainer.removeAttribute("hidden")
        this.navToggle.children[0].style.setProperty("rotate", "0deg")
        this.e.navContainer.style.width = "100%"
        this.nA("0px")
    }
    nClose() {
        this.navToggle.children[0].style.setProperty("rotate", "180deg")
        let sw = getComputedStyle(this.e.navContainer).width
        this.e.navContainer.style.width = "0"
        this.nA(sw)
        this.e.navContainer.setAttribute("hidden", true)
        
    }
    nA(sw) {
        let ew = getComputedStyle(this.e.navContainer).width
        let animation = [
            {width: sw},
            {width: ew}
        ]
        this.e.navContainer.animate(animation, this.timing)
    }
}


class ElementSetState extends MState {
    init(i, b) {
        super.init(i, b)
        this.element.style.setProperty("flex-direction", "column")
        this.bar = UI.element("div", {class: "no-select flex expand", style: "border-bottom: var(--bd-size) solid var(--c-bd); gap: 4px; padding: 8px 1rem; height: fit-content;"})
        this.content = UI.element("div", {class: "flex expand", style: "flex-wrap: wrap;"})
        this.searchInput = UI.component("search")
        this.searchInput.style.setProperty("--t", "calc(var(--text-size) + 5px)")
        this.viewBtn = UI.precomp("button", {icon: "grid_view", html: {style: "padding: 6px"}})
        this.addBtn = UI.precomp("button", {icon: "add", html: {style: "padding: 6px"}})
        this.addBtn.classList.add("add-button")
        this.sorter = UI.precomp("dropdown", {name: "Sort", options: [{text: "Type", value: "c"}, {text: "Set", value: "set"}]})

        htmlAdd(this.searchInput, this.bar)
        htmlAdd(this.sorter, this.bar)
        htmlAdd(this.viewBtn, this.bar)
        htmlAdd(this.addBtn, this.bar)
        htmlAdd(this.bar, this.element)
        htmlAdd(this.content, this.element)    
    }
}

class ProblemState extends ElementSetState {
    static ACTION = {EXPAND: 0}
    constructor(m) {
        super(m)
        this.selectedProblem = null
    }

    action(action) {
        switch (action) {
            case ProblemState.ACTION.EXPAND:
                // this.selectedProblem
                // in problem: onclick dots -> set ccontextmenu?
                // this.manager.main.pContextMenu.element.children[1].children[0]
                break;
        
            default:
                break;
        }
    }

    init(i, b) {
        super.init(i, b)
        let p = new Problem(this)
        p.init()
        htmlAdd(p.element, this.content)
    }
}

class ProblemSetState extends ElementSetState {
    constructor(m) {
        super(m)
        this.problems = new Filer(this)
    }

    init(i, b) {
        super.init(i, b)
        this.path = UI.element("div", {class: "no-select flex expand fs-path-bar"})
        this.ptext = UI.element("div", {class: "flex fs-path-text"})
        this.problems.init()
        htmlAdd(this.ptext, this.path)
        htmlAdd(this.path, this.content, 0)

    }
}

class Editable {
    static init() {
        this.latex.children[0].addEventListener("input", e => {
            if (this.current) {
                try {
                    katex.render(this.latex.children[0].value, this.current)
                    this.current.classList.remove("error")
                } catch {
                    this.current.classList.add("error")
                }
                this.current.setAttribute("data-latex", this.latex.children[0].value)
            }
        })
        this.delete.addEventListener("click", e => {
            if (this.current) {
                this.latex.removeAttribute("open")
                this.current.remove()
                this.current.onclick = null
                this.current = null
            }
        })
        this.latex.addEventListener("focusout", (e) => {
            if (e.relatedTarget == this.delete) {
                return;
            }
            this.latex.removeAttribute("open")
            if (this.current) {
            this.current.classList.remove("selected")
            if (this.current.getAttribute("data-latex").trim() === "") {
                this.current.remove()
                this.current.onclick = null
                this.current = null
            }}
        }, true)
    }
    constructor() {
        this.element = UI.element("div", {}, {class: "expand"})
        this.editor = UI.element("div", {contenteditable: false, class: "editor", spellcheck: false})
        htmlAdd(this.editor, this.element)
        this.edit = true
        this.input = this.input.bind(this)
        this.isCompose = false
        this.compose = this.compose.bind(this)
        this.composeEnd = this.composeEnd.bind(this)
        this.x = /\$(.*?)\$/g;
        this.selectedLatex = null;
        this.selectLatex = this.selectLatex.bind(this)
    }

    editable(bool) {this.edit = bool; if (bool) {this.editor.setAttribute("contenteditable", true); this.editor.focus()} else {this.editor.removeAttribute("contenteditable")}}

    init() {
        this.editor.addEventListener("input", this.input)
        this.editor.addEventListener("compositionstart", this.compose);
        this.editor.addEventListener("compositionend", this.composeEnd);
        this.editor.addEventListener("paste", function(e) {
            e.preventDefault();
            let text = e.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
        });        
    }

    compose() {this.isCompose = true}
    composeEnd() {this.isCompose = false}

    input(e) {
        if (this.isCompose) {return}
        let selection = window.getSelection()
        if (!selection.rangeCount) return;
        let range = selection.getRangeAt(0);
        let node = range.startContainer;  
        if (node.nodeType === Node.TEXT_NODE) {
            this.process(node)
            // $first$ second $third$ fourth
        }
    }

    process(node) {
        let matches = this.o(node.textContent)
        matches.reverse()
        for (const match of matches) {
            let latexSpan = UI.element("span", {contenteditable: false, class: "no-select latex-span", "data-latex": match.content})
            katex.render(match.content, latexSpan)
            latexSpan.onclick = e => {e.preventDefault(); this.selectLatex(latexSpan)}
            let r = document.createRange()
            r.setStart(node, match.start)
            r.setEnd(node, match.end)
            r.deleteContents()
            r.insertNode(latexSpan)
            if (match.content.trim() === "") {this.selectLatex(latexSpan)}
        }        
    }

    selectLatex(span) {
        if (this.selectedLatex) {
            this.selectedLatex.classList.remove("selected")
        }
        this.selectedLatex = span
        span.classList.add("selected")
        const rect = span.getBoundingClientRect();
        Editable.latex.setAttribute("open", true)
        Editable.latex.style.top = `${rect.bottom + window.scrollY + 5}px`;
        Editable.latex.style.left = `${rect.left + window.scrollX}px`;
        Editable.latex.children[0].focus()
        Editable.latex.children[0].value = span.getAttribute("data-latex") || ""
        Editable.current = span
        Editable.latex.dispatchEvent(new Event("input"));
    }

    o(text) {
        let matches = []
        let match;
        this.x.lastIndex = 0
        while ((match = this.x.exec(text)) !== null) {
            matches.push({content: match[1], start: match.index, end: match.index + match[0].length})
        }
        return matches
    }

    destroy() {
        this.editor.removeEventListener("input", this.input)
        this.editor.removeEventListener("compositionstart", this.compose);
        this.editor.removeEventListener("compositionend", this.composeEnd);
        this.editor = null
        this.element.remove()
        this.element = null
    }
}

class EditableWrapper {
    constructor() {
        this.element = UI.element("div", {class: "flex"})
                                        
    }

    init() {
        this.editable = new Editable()
        this.editable.init()
    }
}

class ProblemEditable {
    constructor() {
        this.element = UI.element("div", {class: "flex expand"})
    }
    init() {


    }
}

class Problem {
    constructor(state) {this.main = state}
    
    destroy() {
        this.element.remove()
        this.element = null
        this.buttons.more.onclick = null
        this.buttons.more = null
        this.tags.destroy()
        this.type.destroy()
        this.difficulty.destroy()
        this.editor.destroy()
        this.editor = null
    }

    init() {
        this.element = UI.component("problem")
        this.type = new CDropdowner()
        this.difficulty = new CDropdowner()
        this.buttons = {
            more: UI.precomp("button", {type: FIXED.B_TYPES.ACT, icon: "more_horiz", html: {style: "padding: 0"}, 
                js: {onclick: () => {
                    let box = this.buttons.more.getBoundingClientRect()
                    this.main.selectedProblem = this
                    this.main.manager.main.pContextMenu.show(box.x + box.width*0.5, box.y + box.height*0.5)
                }}
            })
        }
        htmlAdd(this.buttons.more, this.element.children[0].children[1])
        this.tags = new TagHolder()
        this.tags.init()
        this.type.init(this.main.manager.main.typeDropdown)
        this.difficulty.init(this.main.manager.main.difficultyDropdown)
        this.type.hideSubText()
        this.difficulty.hideSubText()
        
        let dropdowner = UI.element("div", {class: "expand flex", style: "flex-direction: column; gap: 4px; flex-wrap: wrap; margin-bottom: 4px;"})
        htmlAdd(this.type.element, dropdowner)
        htmlAdd(this.difficulty.element, dropdowner)
        htmlAdd(dropdowner, this.element.children[2])
        dropdowner = null
        htmlAdd(this.tags.element, this.element.children[2])
        this.editor = new ProblemEditable()
        this.editor.init()
        htmlAdd(this.editor.element, this.element.children[1])
        // this.editor.editable(true)
    }
}

class TagHolder {
    constructor() {this.editing = false}

    destroy() {
        this.element.remove()
        this.noedit()
        this.element = null
        this.input = null
        this.addBtn.onclick = null
        this.addBtn = null
    }

    addTag(text) {
        let tag = UI.component("tag")
        let i = UI.precomp("icon", {text: "close"})
        tag.children[0].textContent = text
        tag.setAttribute("tabindex", "-1")
        i.onclick = () => {
            tag.remove()
            tag = null
            i.onclick = null
            i = null
        }
        htmlAdd(i, tag)
        htmlAdd(tag, this.element, this.element.children.length - 1)
    }

    init() {
        this.element = UI.component("tag-holder")
        this.input = this.element.children[0]
        this.addBtn = UI.precomp("button", {type: FIXED.B_TYPES.DEFAULT, icon: "new_label", html: {style: "padding: 6px;"}})
        this.addBtn.classList.add("tag-button")
        htmlAdd(this.addBtn, this.element, 0)
        this.addBtn.onclick = this.toggle.bind(this)
        this.input.onkeyup = (e) => {
            if (e.keyCode == 13) {
                this.addTag(this.input.value)
                this.input.value = ""
            }
        }        
    }

    toggle() {
        if (this.editing) {
            this.noedit()
        } else {
            this.edit()
        }
    }

    edit() {
        this.input.value = ""
        if (this.editing) {return;}
        this.element.classList.add("tag-edit")
        this.editing = true
        this.input.focus()
        this.input.onblur = (e) => {
            if (e.relatedTarget == null) {
                this.noedit()
                return;
            }
            if (e.relatedTarget.classList.contains("tag")) {
                e.preventDefault()
                this.input.focus()
            }
        }
    }

    noedit() {
        this.element.classList.remove("tag-edit")
        this.editing = false
        this.input.onblur = null
    }
}

class Tags {
    constructor() {
        this.items = new Map()
    }
    destroy() {}
    addTags(id, tags) {
        if (!this.hasId(id)) {throw new Error("Id not found")}
        let o = this.getTags(id)
        let n = [...new Set([...o, ...new Set(tags)])]
        this.items.set(id, n)
        o = null
    }
    removeTags(id, tags) {
        if (!this.hasId(id)) {throw new Error("Id not found")}
        let o = this.getTags(id)
        let r = new Set(tags)
        let n = o.filter(tag => !r.has(tag))
        this.items.set(id, n)
        o = null
        r = null
    }
    getTags(id) {return this.items.get(id) || []}
    add(id, tags=[]) {this.items.set(id, [...new Set(tags)])}
    remove(id) {this.items.delete(id)}
    hasId(id) {return this.items.has(id)}

    allSearch(tags) {
        return Array.from(this.items.entries())
            .filter(([_, itemTags]) => 
                tags.every(searchTag => 
                    itemTags.includes(searchTag)
                )
            )
            .map(([itemId]) => itemId)
    }

    anySearch(tags) {
        return Array.from(this.items.entries())
            .filter(([_, itemTags]) => 
                    tags.some(searchTag => 
                    itemTags.includes(searchTag)
                )
            )
            .map(([itemId]) => itemId);
    }

    getAllTags() {
        let allTags = new Set();
        for (let tags of this.items.values()) {
            tags.forEach(tag => allTags.add(tag));
        }
        return Array.from(allTags);
    }
    uniqueId(keys=[...this.items.keys()]) {
        let id = "";
        for (let i = randint(3, 6); i > 0; --i) {
            id += String.fromCharCode(randint(0, 65535));
        }
        if (!keys.includes(id)) {
            return id   
        } else {
            id = this.uniqueId(keys)
        }
    }
}

class Filer {
    static FORMAT = {WRITTEN: 0, COUNTDOWN: 1}
    constructor(main) {
        this.main = main
        this.root = new FSFolder(null, "~")
        this.pathLink = UI.element("span", {class: "fs-link"}, {textContent: this.root.name, onclick: (() => {this.focus(this.root.name)}).bind(this)})
        this.currentNode = this.root;
        this.wrapper = UI.element("div", {class: "flex expand fs-wrapper fs-grid-view"}, {style: "align-items: flex-start; justify-content: flex-start"})
        this.element = UI.element("div", {class: "flex expand fs-elements"})
        this.types = {}
    }

    init() {
        this.root.init()
        this.types.mathcounts = new ProblemSetType()
        this.types.mathcounts.fromJSON(
            {
                schema: {
                    "year": {type: "int", required: true}, 
                    "level": {type: "enum", values: ["school", "chapter", "state", "nationals"]}, 
                    "round": {type: "enum", values: ["sprint", "target", "team", "countdown"]}
                },
                display: "MathCounts {year} {level} {round}",
                format: {
                    base: {time: 60},
                    variant: {
                        name: "round",
                        values: {
                            sprint: {time: 40, question: 30},
                            target: {time: 24, question: 8, calculator: true},
                            team: {time: 20, question: 10, calculator: true},
                            countdown: {time: 45, type: Filer.FORMAT.COUNTDOWN}
                        }
                    }
                }
            }
        )
        htmlAdd(this.element, this.wrapper)
        htmlAdd(this.wrapper, this.main.content)
        htmlAdd(this.pathLink, this.main.path, 0)


        // TODO
        // insertNode(node, index)
        // console.log(this.types.mathcounts.getFormat({round: "sprint"}))
        this.updatePath()
    }

    focus(path) {
        if (path == this.root.name) {
            this.wrapper.children[0].remove()
            htmlAdd(this.element, this.wrapper)
            this.currentNode = this.root
            this.updatePath()
        } else {
            getNodeAtPath(this.root, path)._root.setFocus()
        }
    }

    updatePath() {
        this.main.ptext.innerHTML = ""
        let currentPath = this.currentNode.path[0]
        for (let i = 1; i < this.currentNode.path.length; ++i) {
            currentPath += this.root.separator
            currentPath += this.currentNode.path[i]
            htmlAdd(getNodeAtPath(this.root, currentPath)._root.pathLink, this.main.ptext)
        }
    }

    add(pse, index) { // TODO INDXE
        this.root.insertNode(pse.fs, index)
        htmlAdd(pse.element, this.element, index)
    }
} 

class ProblemSetType {
    constructor() {
        this.name = ""
        this.schema = {}
        this.format = {}
        this.display = ""
    }

    getFormat(parameters) {
        if (this.format.variant && this.format.variant != {}) {
            return this.format.variant.values[parameters[this.format.variant.name]]
        }
        return this.format.base
    }

    getName(params) {return namedStringFormat(this.display, params)}

    fromJSON(data) {
        this.schema = data.schema
        this.display = data.display 
        this.format = data.format
    }

    toJSON() {
        return {
            schema: this.schema,
            display: this.display,
            format: this.format
        }
    }
}

class ProblemSetElement {
    constructor(state) {
        this.main = state
    }

    init() {
        this.fs._root = this
        this.buttons = {
            more: UI.precomp("button", {type: FIXED.B_TYPES.ACT, icon: "more_horiz", html: {style: "padding: 0"}, 
                js: {onclick: () => {

                }}
            })
        }
        htmlAdd(this.buttons.more, this.element.children[0].lastChild)
    }

    destroy() {
        this.element.remove()
        this.element = null
        this.fs._root = null
        this.fs.destroy()
        this.fs = null
    }

    rename(name) {
        this.fs.rename(name)
        this.element.querySelector(".fs-name").textContent = name
    }

}

class ProblemSetFolder extends ProblemSetElement {
    constructor(state) {
        super(state)
        this.element = UI.component("problem-folder")
        this.childrenElement = UI.element("div", {class: "expand fs-elements folder-children"})
        this.fs = new FSFolder(null, "TODO")
        this.shown = false
    }

    destroy() {
        super.destroy()
        this.pathLink.onclick = null
        this.pathLink = null
    }

    init() {
        super.init()
        this.pathLink = UI.element("span", {class: "fs-link"}, {textContent: this.fs.name, onclick: () => this.setFocus()})
        htmlAdd(UI.precomp("icon", {text: "folder"}),this.element.querySelector(".fs-icon"))
        this.element.onclick = (e) => {
            this.updateShown()
            if (!this.shown && (e.target.classList.contains("problem-folder") || e.target.classList.contains("fs-name") || e.target.classList.contains("p-top"))) { // nav function? // not 3 dots or...
                
                this.shown = true
                // ASSUMPTION REPLACe if grid
                this.setFocus()
            }
        }
    }

    updateShown() {
        this.shown = (this.main.wrapper.children[0] == this.childrenElement)
    }

    setFocus() {
        this.main.wrapper.children[0].remove()
        htmlAdd(this.childrenElement, this.main.wrapper)
        this.main.currentNode = this.fs
        this.main.updatePath()
    }

    rename(name) {
        super.rename(name)
        this.pathLink.textContent = name
    }

    add(pse, index) { // TODO INDXE
        this.fs.insertNode(pse.fs, index)
        htmlAdd(pse.element, this.childrenElement, index)
    }
}

class ProblemSet extends ProblemSetElement {
    constructor(state) {
        super(state)
        this.params = {} // Dict Str:->Any
        this.contest = null
        this.element = UI.component("problem-set")
        this.fs = new FSFile(null, "TODO")
        //    
    }

    init() {
        super.init()
        this.rename(this.contest.getName(this.params))
    }
    
    destroy() {
        super.destroy()
        this.contest = null
    }
}

class CContextMenu {
    constructor(options) {
        this.element = UI.element("div", {class: "no-select context-menu"})
        this.element.style.display = "none"
        htmlAdd(this.element, document.body)
        this.sections = {}
        this.time = 0
        this.options = options
        this.clacked = null

        // this.options.forEach(o => this.do(o))
    }

    link(element) {this.element.remove(); this.element.style.setProperty("position", "relative"); this.parent = element; this.linked=true}

    init() {
        this.options.forEach(o => this.do(o))
        this.doom = ((e) => {
            if (Date.now() - this.time <= 100) {return}
            if (!e.target.className.includes("context-menu")) {
                this.hide()
            }
        }).bind(this)
    }

    clack() {this.hide()}

    do(section, parent=null) {
        let p = parent ? parent : this.element
        let e = UI.component("c-item")
        e.children[0].onclick = combineFunctions(() => {this.clacked = (section.value == undefined) ? e : section.value}, combineFunctions((section.submenu ? () => {} : this.clack.bind(this)), section.onclick ? section.onclick : () => {}))
        this.sections[section.name] = e 
        if (section.icon) {e.children[0].children[0].textContent = section.icon}
        e.children[0].children[1].textContent = section.text
        htmlAdd(e, p)
        if (section.submenu) {
            let i = UI.precomp("icon", {text: "chevron_right"})
            i.classList.add("c-i")
            htmlAdd(i, e.children[0])
            let s = UI.component("c-submenu")
            htmlAdd(s, e)
            section.submenu.forEach(o => this.do(o,s))
        }
    }

    setPos(x, y) {
        let e = (this.linked) ? this.parent : this.element
        e.style.setProperty("left", x+"px")
        e.style.setProperty("top", y+"px")
    }

    show(x=0, y=0) {
        this.setPos(x, y)
        removeEventListener("click", this.doom)
        this.time = Date.now()
        addEventListener("click", this.doom)
        if (this.linked) {
            this.parent.innerHTML = ""
            htmlAdd(this.element, this.parent)
            this.parent.style.display = "block"
        }
        this.element.style.display = "block"
    }

    hide() {
        let e = (this.linked) ? this.parent : this.element
        e.style.display = "none"
        if (this.linked) {
            this.parent.innerHTML = ""
        }
        removeEventListener("click", this.doom)
    }
}

class CDropdownMenu extends CContextMenu {
    constructor(o, edit=false) {
        super(o)
        this.element.classList.remove("context-menu")
        this.element.classList.add("dropdown")
        this.element.classList.add("flex")
        this.element.classList.add("no-select")
        this.editable = edit
        this.editing = false;
        this.which = null
        this.dropper = null
    }

    saw(value, sub=null) {
        if (!this.dropper) {return}
        this.dropper.setText("'" + value + "'", 0)
        if (sub) {
            this.dropper.setText("'" + sub + "'", 1)
        } else {
            this.dropper.setText("a", 1)
        }
    }

    optionSelect(key, welp=false) {
        switch (key) {
            case "edit":
                this.clacked.children[0].children[0].children[1].focus()
                this.clacked.children[0].children[0].children[1].onblur = () => {
                    this.setProperty(this.clacked.ident + "text", this.clacked.children[0].children[0].children[1].textContent)
                    this.clacked.children[0].onclick({target: this.clacked.children[0]})
                }
                break;
            case "menu":
                if (this.clacked.children.length > 1 || !this.clacked.parentNode.classList.contains("dropdown")) {
                    break;
                }
                let z = UI.element("div", {class: "flex dropdown-sublist"})
                let b = this.item("untitled", null)
                b.ident = Date.now()
                this.setProperty(b.ident + "text", "bruh")
                b.children[0].onclick = (z) => {
                    let hasParent = z.target.parentNode.parentNode.classList.contains("dropdown-sublist")
                    if (hasParent) {
                        this.saw(
                            z.target.parentNode.parentNode.parentNode.children[0].children[0].children[1].textContent,
                            z.target.children[0].children[1].textContent
                        )
                    } else {
                        if (!z.target.classList.contains("button")) {return}
                        this.saw(z.target.children[0].children[1].textContent)
                    }
                }                
                htmlAdd(b, z)
                this.dsubmenu(this.clacked, z)
                if (this.which  && this.which.children.length > 0) {this.which.children[1].style.display = "none"}
                this.which = this.clacked
                z.style.setProperty("display", "flex")
                break;
            case "add":
                let a = this.item("untitled", null)
                a.ident = Date.now()
                this.setProperty(a.ident + "text", "bruh")
                a.children[0].onclick = (z) => {
                    let hasParent = z.target.parentNode.parentNode.classList.contains("dropdown-sublist")
                    if (!z.target.classList.contains("button")) {return;}
                    if (hasParent) {
                        this.saw(
                            z.target.parentNode.parentNode.parentNode.children[0].children[0].children[1].textContent,
                            z.target.children[0].children[1].textContent
                        )
                    } else {
                        this.saw(z.target.children[0].children[1].textContent)
                    }
                }
                htmlAdd(a, this.clacked.parentNode, 
                Array.prototype.indexOf.call(this.clacked.parentNode.children, this.clacked) + 1)
                break;
            case "del":
                if (this.which == this.clacked) {this.which = null}
                let i = this.clacked
                i.dots.onclick = null
                i.children[0].onclick = null
                this.removeProperty(i.ident + "text")
                console.log(i.ident)
                if (!welp) {
                    if (!i.parentNode.classList.contains("dropdown")) {
                        if (i.parentNode.children.length == 1) {
                            i.parentNode.parentNode.children[0].onclick = null
                            i.parentNode.parentNode.children[0].children[0].lastChild.remove()
                            i.parentNode.remove()
                        }
                    }
                }
                this.clacked.remove()
                if (i.children[1]) {
                    for (let a of i.children[1].children) {
                        this.clacked = a
                        this.optionSelect(key, true)
                    }
                }
                i = null
                this.clacked = null
            default:
                break;
        }
    }

    toggleEdit() {
        this.editing = !this.editing 
        if (this.editing) {
            this.editButton.setAttribute("active", true)
            this.element.classList.add("d-edit")
        } else {
            this.editButton.removeAttribute("active")
            this.element.classList.remove("d-edit")
        }
    }

    showeditor() {}

    item(text, icon) {
        let i = UI.component("dropdown-item")
        i.children[0].children[0].children[1].textContent = text
        if (this.editable) {
            let dots = UI.precomp("icon", {text: "more_vert"})
            dots.classList.add("dropdown-more")
            htmlAdd(dots, i.children[0].children[1])
            i.dots = dots
            i.dots.onclick = () => {
                this.clacked = i
                let box = i.dots.getBoundingClientRect()
                this.showeditor(box.x + box.width * 0.5, box.y + box.height * 0.5)
                // i.children[0].children[0].children[1].focus()
            }
            dots = null
        }
        if (icon) {
            let svg = document.createElementNS(FIXED.svgNS, "svg")
            // svg.style.setProperty("display", "block")
            // svg.setAttribute("preserveAspectRatio", "xMidYMid meet")
            svg.style.setProperty("height", "100%")
            svg.style.setProperty("width", "var(--text-size)")
            // svg.style.setProperty("aspect-ratio", "1")
            if (icon.href) {
            let use = document.createElementNS(FIXED.svgNS, "use")
            use.setAttribute("href", "#"+icon.href);
            htmlAdd(use, svg)
            use = null
            }
            htmlAdd(svg, i.children[0].children[0].children[0])
            svg = null
        }
        return i
    }

    do(section, parent=null) {
        let p = parent ? parent : this.element
        let e = this.item(section.text, section.icon || null)
        htmlAdd(e, p)
        if (section.submenu) {
            let z = UI.element("div", {class: "flex dropdown-sublist"})
            section.submenu.forEach(a => this.do(a, z))
            this.dsubmenu(e, z)
            z = null
        } else {
            e.children[0].onclick = (z) => {
                let hasParent = z.target.parentNode.parentNode.classList.contains("dropdown-sublist")
                if (!z.target.classList.contains("button")) {return}
                if (hasParent) {
                    this.saw(
                        z.target.parentNode.parentNode.parentNode.children[0].children[0].children[1].textContent,
                        z.target.children[0].children[1].textContent
                    )
                } else {
                    this.saw(z.target.children[0].children[1].textContent)
                }
            }
        }
        this.setProperty(section.value + "text", section.text)
        e.ident = section.value
        e = null
        p = null
    }

    dsubmenu(e, z) {
        htmlAdd(UI.precomp("icon", {text: "chevron_right", html: {style: "opacity: 0.5"}}), e.children[0].children[0])
        htmlAdd(z, e)
        e.children[0].onclick = (l) => {
            if (!l.target.classList.contains("button")) {
                return;
            }
            if (this.which) {
                this.which.children[1].style.display = "none"
                if (this.which == e) {
                    this.which = null
                    return;
                }
            }
            this.which = e
            this.which.children[1].style.display = "flex"
            this.saw(e.children[0].children[0].children[1].textContent)
        }
    }

    show(x=0, y=0) {
        super.show(x, y)
        this.element.style.display = "flex"
    }

    init(key) {
        this.id = key
        this.options.forEach(o => this.do(o))
        this.doom = ((e) => { 
            if (Date.now() - this.time <= 10) {return}
            if (!e.target.className.includes("dropdown") && !e.target.className.includes("context-menu")) {this.hide()}
        }).bind(this)
        if (this.editable) {
            let e = UI.element("div", {class: "flex expand dropdown-edit"})
            this.editButton = UI.precomp("button",{type: FIXED.B_TYPES.NAV, icon: "edit", html: {style: "padding: 4px;"}})
            this.editButton.onclick = () => this.toggleEdit()
            this.editButton.classList.add("dropdown-none")
            htmlAdd(this.editButton, e)
            htmlAdd(e, this.element)
        }
    }

    getProp(prop) {return "--" + this.id + prop}

    setProperty(prop, value) {document.querySelector(":root").style.setProperty(this.getProp(prop), value)}    

    removeProperty(prop) {document.querySelector(":root").style.removeProperty(this.getProp(prop))}
}

class CDropdowner {
    constructor() {
        // https://stackoverflow.com/questions/76820160/change-replace-label-text-content-by-using-css-variable
        this.click = this.click.bind(this)
    }

    destroy() {
        this.element.remove()
        this.element.removeEventListener("click", this.click)
        this.element = null
        this.textE = null
    }

    click() {
        let box = this.element.getBoundingClientRect()
        this.dropdown.show(box.x, box.y + box.height + 2)
    }

    init(dropdown) {
        this.dropdown = dropdown
        this.element = UI.component("dropdown-select")
        this.element.classList.add("expand")
        this.textE = this.element.children[1]
        this.element.addEventListener("click", this.click)
        this.dropdown.dropper = this
        // this.setProperty("text-main", "'I...grind'")
        // this.setProperty("text-sub", "'Premature Optimization is the root of all evil'")
        // this.element.children[1].children[0].style.setProperty("--text", "var(" + this.getProp("text-main")  +  ")")
        // this.element.children[1].children[1].style.setProperty("--text", "var(" + this.getProp("text-sub") + ")")
        // in dropdown make var set this to
    }

    hideSubText() {
        this.element.children[1].children[1].style.setProperty("height", "0")
        this.setText("_", 1)
    }

    setText(t, i = 0) {
        this.textE.children[i].style.setProperty("--text", t)
    }
}


UI.component = (name) => {return UI.compose(UI.c[name])}
UI.register = (name, element) => {UI.c[name] = UI.decompose(element)}

UI.decompose = (e) => {
    if (e.children.length == 0) {return {element: e.cloneNode(), childs: false, text: e.textContent}}
    return {element: e.cloneNode(), childs: Array.from(e.children).map((c) => {return UI.decompose(c)})}
}
UI.compose = (l) => {
    let e = l.element.cloneNode()
    if (l.text) {e.textContent = l.text}
    if (l.childs) {l.childs.forEach(c => e.appendChild(UI.compose(c)))}
    return e
}

UI.special = (name, element, fn) => {
    UI.c[name] = {e: UI.decompose(element), f: fn}
}

UI.precomp = (name, params) => {
    let e = UI.compose(UI.c[name].e)
    if (params.html) {UI.setAttributes(e, params.html)}
    if (params.js) {UI.setOtherAttrs(e, params.js)}
    UI.c[name].f.call(null, e, params)
    params = null
    return e

}

UI.default = () => {
    let n = document.querySelector("#not-shown")
    let git = (query) => {return n.querySelector(query)}
    UI.special("button", git(".button[style-type=default]"), 
    (e, params) => {
        if (params.type) {
            e.setAttribute("style-type", params.type)
        }
        if (params.icon) {
            htmlAdd(UI.precomp("icon", {text: params.icon}), e)
        }
    })
    UI.special("icon", git("span.material-symbols-rounded"), 
    (e, params) => {
        e.textContent = params.text || ""
    })
    UI.register("search", git("div.search"))
    UI.special("dropdown", git("form"), 
    (e, params) => {
        if (params.name) {
            e.children[0].lastChild.textContent = params.name
        }
        let options = params.options
        if (!options) {return;}
        options.forEach(o => {
            htmlAdd(UI.element("option", {value: o.value}, {textContent: o.text}), e.children[0])
        })
    })
    UI.register("problem", git(".problem"))
    
    UI.register("tag", git(".tag"))
    UI.register("tag-holder", git(".tag-holder"))

    UI.register("c-submenu", git(".context-menu-sublist"))
    UI.register("c-item", git(".context-menu-item"))

    UI.register("dropdown-item", git(".dropdown-item"))

    UI.register("dropdown-select", git(".dropdown-select"))

    UI.register("problem-folder", git(".problem-folder"))
    UI.register("problem-set", git(".problem-set"))

}

function htmlAdd(child, element, index=element.children.length) {
    if (index >= element.children.length) {
        element.appendChild(child)
    } else {
        element.insertBefore(child, element.children[index])
    }
}

onload = () => main()