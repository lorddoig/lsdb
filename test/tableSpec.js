/// <reference path="../ts-definitions/DefinitelyTyped/karma-jasmine/karma-jasmine.d.ts" />
var LSDB = require('../lsdb');
var _ = require('underscore');

var alice = { id: 1, name: 'Alice', score: 10, address: 'moon', species: 'cryptographer' };
var bob = { id: 2, name: 'Bob', score: 0, address: 'tv', species: 'cryptographer' };

var TestTable = new LSDB.Table('testData');

afterEach(function () {
    TestTable.clear();
});

describe("where()", function () {
    it("is accurate", function () {
        TestTable.insert(alice);
        TestTable.insert(bob);
        expect(TestTable.where({ name: 'Alice' })).toEqual([alice]);
    });
});

describe("findWhere()", function () {
    it("is accurate", function () {
        TestTable.insert(alice);
        TestTable.insert(bob);
        expect(TestTable.findWhere({ name: 'Alice' })).toEqual(alice);
    });
});

describe("insert()", function () {
    it("inserts", function () {
        expect(TestTable.all()).toEqual([]);
        TestTable.insert(alice);
        expect(TestTable.all()).toEqual([alice]);
    });
});

describe("insertBatch()", function () {
    it("inserts in batches", function () {
        expect(TestTable.all()).toEqual([]);
        TestTable.insertBatch([alice, bob]);
        expect(TestTable.all()).toEqual([alice, bob]);
    });
});

describe("update()", function () {
    it("updates", function () {
        TestTable.insert(alice);
        TestTable.update({ id: 1, score: 11 });
        var expected = _.clone(alice);
        expected.score = 11;
        expect(TestTable.findWhere({ id: 1 })).toEqual(expected);
    });
});

describe("updateBatch()", function () {
    it("updates", function () {
        TestTable.insertBatch([alice, bob]);
        TestTable.updateBatch([
            { id: 1, address: 'mars' },
            { id: 2, address: 'uranus' }
        ]);

        var expectedAlice = _.clone(alice);
        expectedAlice.address = 'mars';
        var expectedBob = _.clone(bob);
        expectedBob.address = 'uranus';
        expect(TestTable.all()).toEqual([expectedAlice, expectedBob]);
    });
});

describe("destroy()", function () {
    it("destroys records", function () {
        TestTable.insertBatch([alice, bob]);
        expect(TestTable.all()).toEqual([alice, bob]);

        TestTable.destroy(1);
        expect(TestTable.all()).toEqual([bob]);
    });
});

describe("destroyWhere()", function () {
    it("destroys records", function () {
        TestTable.insertBatch([alice, bob]);
        expect(TestTable.all()).toEqual([alice, bob]);
        TestTable.destroyWhere({ species: 'cryptographer' });
        expect(TestTable.all()).toEqual([]);
    });
});

describe("clear()", function () {
    it("clears the database", function () {
        TestTable.insert(alice);
        expect(TestTable.all()).toEqual([alice]);
        TestTable.clear();
        expect(TestTable.all()).toEqual([]);
    });
});

describe("all()", function () {
    it("returns all the rows", function () {
        TestTable.insert(alice);
        TestTable.insert(bob);
        expect(TestTable.all()).toEqual([alice, bob]);
    });
});

describe("merge()", function () {
    it("merges objects", function () {
        var table = TestTable;
        var original = { one: 1, two: 2, three: 3, all: 'infinity' };
        var _original = table.deepClone(original);
        var updates = { one: 'unity', all: '-1/12' };
        var _updates = table.deepClone(updates);

        var expected = { one: 'unity', two: 2, three: 3, all: '-1/12' };
        var updated = table.merge(original, updates);

        expect(updated).toEqual(expected);
        expect(original).toEqual(_original);
        expect(updates).toEqual(_updates);
    });
});
//# sourceMappingURL=tableSpec.js.map
