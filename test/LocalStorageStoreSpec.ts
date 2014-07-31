/// <reference path="../ts-definitions/DefinitelyTyped/karma-jasmine/karma-jasmine.d.ts" />
import LSDB = require('../lsdb');

var TestTable = new LSDB.Table('testTable123');
var Backend = TestTable.backend;

beforeEach(()=> {
    TestTable.insert({id: 1, name: 'Sean'});
});

afterEach(()=> {
    Backend.clear();
});

describe("hasKey()", ()=> {
    it("returns true if key exists", ()=> {
        expect(Backend.hasKey('testTable123')).toBe(true);
    });

    it("returns false if key doesn't exist", ()=> {
        expect(Backend.hasKey('iNoExist!')).toBe(false);
    });
});
