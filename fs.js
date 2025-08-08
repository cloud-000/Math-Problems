// Utility: Check if a child with the given name exists in children array
function _hasChild(name, children) {
    for (let i = 0; i < children.length; ++i) {
        if (children[i].name === name) {
            return true;
        }
    }
    return false;
}

// Utility: Find the next available number suffix for a child name (e.g., name, name(1), name(2), ...)
function _hasChildNth(name, children) {
    let count = 0;
    let candidate = name;
    while (_hasChild(candidate, children)) {
        count++;
        candidate = `${name}(${count})`;
    }
    return count;
}

// Base class for file system nodes (both files and folders)
class CFileSystemNode {
    #pathStr = "";
    constructor(parent, name) {
        this.parent = parent || null;
        this.name = name;
        this.path = [];
        this.is_directory = false;
        this.root_parent = null;
    }

    init() {
        this.root_parent = this.getRootParent();
        this.updatePath();
    }

    updatePath() {
        this.path = [];
        this._makePath(this);
        this.#pathStr = this.path.join(this.root_parent ? this.root_parent.separator : "/");
    }

    getPathString() {
        return this.#pathStr;
    }

    getRootParent() {
        let node = this;
        while (node.parent) {
            node = node.parent;
        }
        return node;
    }

    _makePath(self) {
        if (this.parent) {
            this.parent._makePath(self);
        }
        self.path.push(this.name);
    }

    destroy() {
        if (this.parent && this.parent.children) {
            const idx = this.parent.children.indexOf(this);
            if (idx !== -1) {
                this.parent.children.splice(idx, 1);
            }
        }
        delete this.path;
        delete this.parent;
    }

    rename(name) {
        this.name = name;
        this.updatePath();
    }    
}

// File node
class FSFile extends CFileSystemNode {
    constructor(parent, name) {
        super(parent, name);
    }

    toData() {
        return {
            type: "file",
            name: this.name,
        };
    }
}

// Folder node
class FSFolder extends CFileSystemNode {
    constructor(parent, name) {
        super(parent, name);
        this.children = [];
        this.is_directory = true;
        // Use "/" as default separator
        this.separator = "/";
    }

    _hasChildNth(name) {
        return _hasChildNth(name, this.children);
    }

    _hasChild(name) {
        return _hasChild(name, this.children);
    }

    insertNode(node, index) {
        node.parent = this;
        node.init();
        this.children.splice(index, 0, node);
        this.updatePath();
    }

    addNode(node) {
        this.insertNode(node, this.children.length);
    }

    removeNode(index) {
        if (index >= 0 && index < this.children.length) {
            this.children[index].destroy();
            this.children.splice(index, 1);
        }
    }

    toData() {
        return {
            type: "folder",
            name: this.name,
            children: this.children.map(child => child.toData())
        };
    }

    destroy() {
        // Remove all children first
        while (this.children.length > 0) {
            this.children[0].destroy();
        }
        delete this.children;
        super.destroy();
    }

    updatePath() {
        super.updatePath();
        if (this.children) {
            this.children.forEach(child => child.updatePath());
        }
    }
}
