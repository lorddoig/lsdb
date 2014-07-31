define(["require", "exports", "node_modules/underscore/underscore"], function(require, exports) {
    /// <reference path="ts-definitions/DefinitelyTyped/underscore/underscore.d.ts" />
    

    var _ = require('underscore');

    (function (Store) {
        /**
        * A simple wrapper class around localStorage for purposes of abstraction.
        * @class
        */
        var LocalStorage = (function () {
            function LocalStorage() {
            }
            LocalStorage.prototype.length = function () {
                return localStorage.length;
            };

            LocalStorage.prototype.getItem = function (key) {
                return localStorage.getItem(key);
            };

            LocalStorage.prototype.setItem = function (key, data) {
                try  {
                    localStorage.setItem(key, data);
                } catch (error) {
                    if (error === QUOTA_EXCEEDED_ERR) {
                        return false;
                    } else {
                        throw error;
                    }
                }

                return true;
            };

            LocalStorage.prototype.removeItem = function (key) {
                localStorage.removeItem(key);
            };

            LocalStorage.prototype.clear = function () {
                localStorage.clear();
            };

            LocalStorage.prototype.hasKey = function (key) {
                var item = localStorage.getItem(key);
                return !(_.isNull(item) || _.isUndefined(item));
            };
            return LocalStorage;
        })();
        Store.LocalStorage = LocalStorage;
    })(exports.Store || (exports.Store = {}));
    var Store = exports.Store;

    var Table = (function () {
        /**
        * @constructor
        * @param name - the name of the table
        * @param defaultUniqueKey - the default unique key to use for updates
        * @param backend - the storage connector
        */
        function Table(name, defaultUniqueKey, backend) {
            if (typeof defaultUniqueKey === "undefined") { defaultUniqueKey = 'id'; }
            if (typeof backend === "undefined") { backend = new Store.LocalStorage(); }
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
        Table.prototype.query = function () {
            var clone = this.deepClone(this._rows);
            return _.chain(clone);
        };

        /**
        * Convenience method around query().
        * @param attributes
        * @returns {T[]}
        */
        Table.prototype.where = function (attributes) {
            return this.query().where(attributes).value();
        };

        /**
        * Convenience method around query();
        * @param attributes
        * @returns {T}
        */
        Table.prototype.findWhere = function (attributes) {
            return this.query().findWhere(attributes).value();
        };

        /**
        * Get all the records in the table.
        * @returns {any}
        */
        Table.prototype.all = function () {
            return this.deepClone(this._rows);
        };

        /**
        * Insert a row.  Note that this doesn't check for record uniqueness.
        * @param row - the row to insert
        * @returns {boolean}
        */
        Table.prototype.insert = function (row) {
            var toInsert = this.deepClone(row);
            this._rows.push(toInsert);
            return this.save();
        };

        /**
        * Insert multiple rows. No uniqueness check.
        * @param rows
        * @returns {boolean}
        */
        Table.prototype.insertBatch = function (rows) {
            var toInsert = this.deepClone(rows);
            this._rows = this._rows.concat(toInsert);
            return this.save();
        };

        /**
        * Update the row with the given attributes.  The attributes must include
        *  the uniqueKey.
        * @param rowAttrs - the attributes to update including the unique identifier
        * @param uniqueKey - the key to use in finding a unique record to update
        * @returns {boolean} - true if record found and updated, false otherwise
        */
        Table.prototype.update = function (rowAttrs, uniqueKey) {
            return this.doUpdate(rowAttrs, true, uniqueKey);
        };

        /**
        * Do multiple updates in one call.
        * @see update
        * @param rowsAttrs
        * @param uniqueKey
        * @returns {boolean}
        */
        Table.prototype.updateBatch = function (rowsAttrs, uniqueKey) {
            var _this = this;
            _.each(rowsAttrs, function (attrs) {
                _this.doUpdate(attrs, false, uniqueKey);
            });

            return this.save();
        };

        /**
        * Drop the entire table.
        */
        Table.prototype.clear = function () {
            this._rows = [];
            this.save();
        };

        /**
        * Internal method used to actually perform updates.
        * @private
        * @param rowAttrs
        * @param save
        * @param uniqueKey
        * @returns {boolean}
        */
        Table.prototype.doUpdate = function (rowAttrs, save, uniqueKey) {
            var toUpdate = this.deepClone(rowAttrs);
            var key = uniqueKey ? uniqueKey : this._defaultUniqueKey;
            var criteria = {};
            var record;

            criteria[key] = toUpdate[key];
            record = _.findWhere(this._rows, criteria);

            if (_.isEmpty(record))
                return false;

            var updatedRecord = this.merge(record, toUpdate);
            var rows = _.without(this._rows, record);
            rows.push(updatedRecord);

            this._rows = rows;
            return (save ? this.save() : true);
        };

        /**
        * A utility function to merge the given attributes into the given record.
        * @private
        * @param record - the record to return updated.
        * @param attributes - the attributes to update.
        * @returns {any} - the updated record.
        */
        Table.prototype.merge = function (record, attributes) {
            var toMerge = this.deepClone(record);
            for (var attr in attributes) {
                toMerge[attr] = attributes[attr];
            }

            return toMerge;
        };

        /**
        * A utility function to return a deep copy of the given object. We do this
        *  a lot so as not to modifier users' original objects.
        * @param obj
        * @returns {any}
        */
        Table.prototype.deepClone = function (obj) {
            return JSON.parse(JSON.stringify(obj));
        };

        /**
        * Persist the current data.
        * @private
        * @returns {boolean}
        */
        Table.prototype.save = function () {
            return this.backend.setItem(this._name, JSON.stringify(this._rows));
        };

        /**
        * Load existing data in the backend.
        * @private
        */
        Table.prototype.loadData = function () {
            var rows = [];

            if (this.backend.hasKey(this._name) && !_.isEmpty(this.backend.getItem(this._name))) {
                try  {
                    rows = JSON.parse(this.backend.getItem(this._name));
                } catch (err) {
                    var error = new Error("Attempted to load detected existing " + "data for database '" + this._name + "', but data " + "received was not valid JSON.");

                    throw error;
                }
            }

            this._rows = rows;
            this.save();
        };
        return Table;
    })();
    exports.Table = Table;
});
