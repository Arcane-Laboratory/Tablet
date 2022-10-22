"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = void 0;
class Table {
    constructor(name) {
        this.name = name;
        this.cache = new Map();
        Table.all.set(this.name, this);
    }
    toString() {
        let str = `GihaTable: ${this.name} \n${this.cache.size} entries`;
        this.cache.forEach((datum) => (str += `\n ${datum.id}: ${Table.idDataStringify(datum)}`));
        return str;
    }
    validate(entry) {
        return entry.id !== undefined;
    }
    static idDataStringify(datum) {
        let str = '';
        if (datum.name)
            str += datum.name;
        if (datum.size)
            str += '\n   size: ' + datum.size;
        if (datum.description)
            str += '\n  > ' + datum.description;
        return str;
    }
}
exports.Table = Table;
Table.all = new Map();
