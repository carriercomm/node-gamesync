'use strict'

var assert = require('assert');
var json = require('../shared/json');

var obj1 = {
    'someArray': [1,2,3],
    'someNull': null,
    'someFunction': function (x) { return x },
    'someString': 'hello',
    'someNumber': 100,
    'someObject': {
        'nestedNumber': 456,
        'nestedObject': {
            'deepFunction': function (x) { return x },
            'deepNumber': 789,
            'deepString': 'whatsup'
        }
    }
};

var obj2 = {
    'someArray': [1,4,3,9],
    'someNull': null,
    'someFunction': function (x) { return x },
    'someNumber': 200,
    'someObject': {
        'nestedNumber': 456,
        'nestedObject': {
            'deepFunction': function (x) { return x },
            'deepNumber': 999,
            'deepString': 'notawholelot'
        }
    },
    'newProperty': 'hi'
};

describe('json', function(){
    describe('#lerp()', function(){
        var halfLerp = json.lerp(obj1,obj2,0.5);

        function closeTo (a,b) {
            return Math.abs(a-b) < 1e-9;
        }

        it('should clamp on first or last value',function(){
            assert.equal (json.lerp(obj1,obj2,-0.01), obj1);
            assert.equal (json.lerp(obj1,obj2, 1.01), obj2);
        });

        it('should lerp numbers',function(){
            assert (closeTo (3, halfLerp.someArray[1]));
            assert (closeTo (150, halfLerp.someNumber));
            assert (closeTo (894, halfLerp.someObject.nestedObject.deepNumber));
        });

        it('should drop properties which are not in both objects',function(){
            assert.equal('undefined', typeof halfLerp.someArray[3]);
            assert.equal('undefined', typeof halfLerp['someString']);
            assert.equal('undefined', typeof halfLerp['newProperty']);
        });

        it('should not drop strings',function(){
            assert.notEqual('undefined', typeof halfLerp.someObject.nestedObject['deepString']);
        });

        it('should not convert arrays to hashes',function(){
            assert (halfLerp.someArray instanceof Array);
        });
    });

    describe('#applyDiff()',function(){
        it('should be able to apply the result of jsonDiff',function(){
            var diff = json.diff(obj1,obj2);
            assert(json.equal(json.applyDiff(obj1,diff),obj2));
        });
    });
});
