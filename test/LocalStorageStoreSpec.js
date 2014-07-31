/// <reference path="../ts-definitions/DefinitelyTyped/karma-jasmine/karma-jasmine.d.ts" />
var LSDB = require('../lsdb');

var TestTable = new LSDB.Table('testTable123');
var Backend = TestTable.backend;

beforeEach(function () {
    TestTable.insert({ id: 1, name: 'Sean' });
});

afterEach(function () {
    Backend.clear();
});

describe("hasKey()", function () {
    it("returns true if key exists", function () {
        expect(Backend.hasKey('testTable123')).toBe(true);
    });

    it("returns false if key doesn't exist", function () {
        expect(Backend.hasKey('iNoExist!')).toBe(false);
    });
});
//# sourceMappingURL=LocalStorageStoreSpec.js.map
