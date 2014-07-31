/// <reference path="ts-definitions/DefinitelyTyped/underscore/underscore.d.ts" />
/// <amd-dependency path="node_modules/underscore/underscore" />
declare var QUOTA_EXCEEDED_ERR;
declare var require;
var _ = require('underscore');

export module Store {
    export interface GenericStorage {
        length():number;
        getItem(key:string):string;
        setItem(key:string, data:string):boolean;
        removeItem(key:string):void;
        clear():void;
        hasKey(key:string):boolean;
    }

    /**
     * A simple wrapper class around localStorage for purposes of abstraction.
     * @class
     */
    export class LocalStorage implements GenericStorage {

        constructor() {
        }

        public length() {
            return localStorage.length;
        }

        public getItem(key:string):string {
            return localStorage.getItem(key);
        }

        public setItem(key:string, data:string):boolean {
            try {
                localStorage.setItem(key, data);
            } catch (error) {
                if (error === QUOTA_EXCEEDED_ERR) {
                    return false;
                } else {
                    throw error;
                }
            }

            return true;
        }

        public removeItem(key:string):void {
            localStorage.removeItem(key);
        }

        public clear():void {
            localStorage.clear();
        }

        public hasKey(key:string):boolean {
            var item = localStorage.getItem(key);
            return !(_.isNull(item) || _.isUndefined(item));
        }
    }
}

export class Table {
    public backend:Store.GenericStorage;
    private _name:string;
    private _rows:any[];
    private _defaultUniqueKey:string;

    /**
     * @constructor
     * @param name - the name of the table
     * @param defaultUniqueKey - the default unique key to use for updates
     * @param backend - the storage connector
     */
    constructor(name:string,
                defaultUniqueKey:string = 'id',
                backend:Store.GenericStorage = new Store.LocalStorage()) {
        this._name = name;
        this._defaultUniqueKey = defaultUniqueKey;
        this.backend = backend;
        this.loadData();
    }

    /**
     * Start a query.  Returns a chainable underscore object to complete query
     *  with where() etc.  Must call value() when done.
     * @returns {_Chain<T>|_Chain<any>}
     */
    query() {
        var clone = this.deepClone(this._rows);
        return _.chain(clone);
    }

    /**
     * Convenience method around query().
     * @param attributes
     * @returns {T[]}
     */
    where(attributes:any) {
        return this.query().where(attributes).value();
    }

    /**
     * Convenience method around query();
     * @param attributes
     * @returns {T}
     */
    findWhere(attributes:any) {
        return this.query().findWhere(attributes).value();
    }

    /**
     * Get all the records in the table.
     * @returns {any}
     */
    all() {
        return this.deepClone(this._rows);
    }

    /**
     * Insert a row.  Note that this doesn't check for record uniqueness.
     * @param row - the row to insert
     * @returns {boolean}
     */
    insert(row:any) {
        var toInsert = this.deepClone(row);
        this._rows.push(toInsert);
        return this.save();
    }

    /**
     * Insert multiple rows. No uniqueness check.
     * @param rows
     * @returns {boolean}
     */
    insertBatch(rows:any[]) {
        var toInsert = this.deepClone(rows);
        this._rows = this._rows.concat(toInsert);
        return this.save();
    }

    /**
     * Update the row with the given attributes.  The attributes must include
     *  the uniqueKey.
     * @param rowAttrs - the attributes to update including the unique identifier
     * @param uniqueKey - the key to use in finding a unique record to update
     * @returns {boolean} - true if record found and updated, false otherwise
     */
    update(rowAttrs:any, uniqueKey:string = this._defaultUniqueKey) {
        return this.doUpdate(rowAttrs, true, uniqueKey);
    }

    /**
     * Do multiple updates in one call.
     * @see update
     * @param rowsAttrs
     * @param uniqueKey
     * @returns {boolean}
     */
    updateBatch(rowsAttrs:any[], uniqueKey:string = this._defaultUniqueKey) {
        _.each(rowsAttrs, (attrs) => {
             this.doUpdate(attrs, false, uniqueKey);
        });

        return this.save();
    }

    /**
     * Destroy a record based on it's unique key
     * @param id - the unique identifier value to locate the record
     * @param uniqueKey - the unique identifier field name e.g. 'id'
     * @returns {boolean}
     */
    destroy(id, uniqueKey:string = this._defaultUniqueKey) {
        var criteria = {};
        criteria[uniqueKey] = id;

        var match = _.findWhere(this._rows, criteria);
        if (match) {
            this._rows = _.without(this._rows, match);
            return this.save();
        } else {
            return false;
        }
    }

    /**
     * Destroy all records matching criteria.
     * @see where
     * @param criteria
     * @returns {boolean}
     */
    destroyWhere(criteria) {
        var matches = _.where(this._rows, criteria);
        var newRows = _.difference(this._rows, matches);
        this._rows = newRows;
        return this.save();
    }

    /**
     * Drop the entire table.
     */
    clear() {
        this._rows = [];
        return this.save();
    }

    /**
     * Internal method used to actually perform updates.
     * @private
     * @param rowAttrs
     * @param save
     * @param uniqueKey
     * @returns {boolean}
     */
    private doUpdate(rowAttrs:any, save?:boolean, uniqueKey:string = this._defaultUniqueKey) {
        var toUpdate = this.deepClone(rowAttrs);
        var criteria = {};
        var record;

        criteria[uniqueKey] = toUpdate[uniqueKey];
        record = _.findWhere(this._rows, criteria);

        if (_.isEmpty(record)) return false;

        var updatedRecord = this.merge(record, toUpdate);
        var rows = _.without(this._rows, record);
        rows.push(updatedRecord);

        this._rows = rows;
        return (save ? this.save() : true);
    }

    /**
     * A utility function to merge the given attributes into the given record.
     * @private
     * @param record - the record to return updated.
     * @param attributes - the attributes to update.
     * @returns {any} - the updated record.
     */
    private merge(record, attributes) {
        var toMerge = this.deepClone(record);
        for (var attr in attributes) {
            toMerge[attr] = attributes[attr];
        }

        return toMerge;
    }

    /**
     * A utility function to return a deep copy of the given object. We do this
     *  a lot so as not to modifier users' original objects.
     * @param obj
     * @returns {any}
     */
    private deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Persist the current data.
     * @private
     * @returns {boolean}
     */
    private save():boolean {
        return this.backend.setItem(this._name, JSON.stringify(this._rows));
    }

    /**
     * Load existing data in the backend.
     * @private
     */
    private loadData() {
        var rows = [];

        if (this.backend.hasKey(this._name) &&
            !_.isEmpty(this.backend.getItem(this._name))) {

            try {
                rows = JSON.parse(this.backend.getItem(this._name));
            } catch (err) {
                var error = new Error("Attempted to load detected existing " +
                    "data for database '" + this._name + "', but data " +
                    "received was not valid JSON.");

                throw error;
            }
        }

        this._rows = rows;
        this.save();
    }
}

