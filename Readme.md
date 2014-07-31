# LSDB

A TypeScript/JavaScript ORM (currently) backed by `localStorage`.

## Install and set up

### Browserify/CommonJS

Run:

    npm install --save lsdb

Then for TypeScript:

    import LSDB = require('node_modules/lsdb/lsdb')

Or JavaScript:

    var LSDB = require('lsdb')

### RequireJS/AMD

    var LSDB = require('node_modules/lsdb/dist/lsdb-amd')

## Usage

LSDB provides a very lightweight ORM over localStorage.  Start by setting up a 
table:

    var Pictures = new LSDB.Table('pictures');
    
you can also provide a unique key (used in update/delete operations):

    var Pictures = new LSDB.Table('pictures', 'id');
    
this is set to `'id'` by default.  Now you can:

### Insert

    var pic = {id: 1, caption: "I'm a picture", url: "http://example.com/pic.jpg"};
    Pictures.insert(pic);

### Retrieve

    Pictures.findWhere({id: 1});
    // {id: 1, caption: "I'm a picture", url: "http://example.com/pic.jpg"}
    
    Pictures.where({id: 1});
    // [{id: 1, caption: "I'm a picture", url: "http://example.com/pic.jpg"}]
    
    Pictures.all();
    // [{id: 1, caption: "I'm a picture", url: "http://example.com/pic.jpg"}]

Note that `findWhere()` returns *the first matching record* - no warnings/errors
for non-unique criteria.

#### Complex queries

There is also the `query()` method which returns an [Underscore.js](http://underscorejs.org)
*chain*.  You can then use Underscore's [extensive methods library](http://underscorejs.org)
to perform complex queries.  Lets set up a new table and pretend it has data 
as per the 'schema':

    var Accounts = new LSDB.Table('accounts');
    // Schema: {id: number, name: string, age: number, type: string, sex: string}
    
Now lets look for all customers whose name begins with 'G', sort them by
age, and group them by sex:

    Accounts.query()
    .where({type: 'customer'})
    .filter(function(account){
        return /^g/i.test(account.name);
    })
    .sortBy('age')
    .groupBy('sex')
    .value();
    
    // {
    //      'male': [
    //          {id: 23, name: 'Gordon', age: 55, type: 'customer', sex: 'male'},
    //          {id: 11, name: 'Graham', age: 23, type: 'customer', sex: 'male'}
    //      ],
    //
    //      'female': [
    //          {id: 32, name: 'Gladys', age: 44, type: 'customer', sex: 'female'},
    //          {id: 78, name: 'Glynis', age: 19, type: 'customer', sex: 'female'}
    //      ]
    // }

It's pretty much a fully-featured query interface, praise be unto Underscore.js.

### Update

#### Single record

    var pic = Picture.findWhere({id: 1});
    pic.caption = "I'm a picture of a kitten";
    Pictures.update(pic);
    Pictures.findWhere({id: 1});
    // {id: 1, caption: "I'm a picture of a kitten", url: "http://example.com/pic.jpg"}
    
    
#### Multiple records

Simply loops over the inputs essentially calling `update()` for each one, but
processes all records before persisting.

    var pics = [{id: 1, caption: "One", score: 10},
                {id: 2, caption: "Two", score: 20}];
    
    var attrs = [{id: 1, score: 100}, {id: 2, score: 200}];
    
    Pictures.insertBatch(pics);
    Pictures.updateBatch(attrs);
    Pictures.all();
    // [{id: 1, caption: "One", score: 100}, {id: 2, caption: "Two", score: 200}]
    
### Destroy

#### Single record

    var pics = Pictures.all();
    // [{id: 1, caption: "I'm a picture of a kitten", url: "http://example.com/pic.jpg"}]
    Pictures.destroy(pics[0].id);
    Pictures.all();
    // []

`'id'` is the default unique identifier, so this found the first record with an
id of 1 and blasted it.

#### Multiple records

    var Accounts = LSDB.Table('accounts');
    Accounts.insertBatch([{id:1, type: 'customer'},{id: 2, type: 'customer'}]);
    Accounts.destroyWhere({type: 'customer'});
    Accounts.all();
    // []
    
### Record Identity

Update and destroy operations require a unique id by which to locate records,
by default it is 'id', but you can override the default with your own default by
specifying it as the second argument to the constructor:

    var Accounts = LSDB.Table('accounts', 'email');
    
or you can override it *per query* by specifying it as the second argument:
 
    Accounts.update({card_number: 23232, email: 'someone@example.com'}, 'card_number');
    
in this case it will find the first record with a card number of 23232 and 
update it's email address.

**NOTE**: This is increasingly looking like a questionable design decision,
especially as **uniqueness of incoming records is not (yet) enforced**.
    
## Gotchas, caveats, etc

### Internal state

Table data is held in an internal variable called `_rows`. When you instantiate 
a new table, LSDB pulls existing data in localStorage into `_rows`. Updates,
inserts, and destroy operations work like this:

1. Modify `_rows`
2. Turn `_rows` into JSON and persist it to `localStorage`

which means that an LSDB table instance is unaware of changes it doesn't make,
and indeed will overwrite those changes on next save.

### Object identity

Everything coming into, or going out of, an LSDB table is deep cloned (via
`JSON.parse(JSON.stringify(obj))`).  This means you can't fiddle with LSDB's
internal state accidentally, and LSDB can't fiddle with yours.

### Record identity

**Uniqueness is not enforced!**

## Contributing

You know the drill.

## License

MIT.
