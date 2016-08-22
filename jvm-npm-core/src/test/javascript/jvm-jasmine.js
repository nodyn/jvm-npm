/**
 *
 * JASMINE JS LITE FOR JVM JAVASCRIPT
 *
 */

var writer = new java.io.StringWriter();
var out = new java.io.PrintWriter(writer);
var System = java.lang.System,
    Integer = java.lang.Integer
        ;

var jasmine = {
    nTest:0,
    nFail:0,
    beforeEach:null,
    printReport:function() {
        out.println();
        out.println("========================");
        out.print( "report test/fail ");
            out.print(new Integer(jasmine.nTest));
            out.print("/");
            out.println(new Integer(jasmine.nFail));
        out.println("========================");
        out.println();
    }
};

function beforeEach( cb ) {
    jasmine.beforeEach = cb;
}

function describe( msg, cb, config ) {
    this.fail = function( m ) {
        throw new Error(m);
    };

    this.config = config || {};

    out.println( msg );

    cb.call(this);
}

function it( msg, cb, config ) {
    if( jasmine.beforeEach ) jasmine.beforeEach();

    out.print( "\t"); out.print(msg);

    if( !config && this.config['disable'] ) {
      out.println( " ....skipped");
      return;
    }
    if( config && config['disable'] ) {
      out.println( " ....skipped");
      return;
    }

    ++jasmine.nTest;

    try {
        cb();
        out.println(" ....passed");
    }
    catch( e ) {
        ++jasmine.nFail;
        out.println(" ....error\n\n>>>");
            out.println(e.message);
            out.println("<<<");
    }
}

function expect( condition ) {

    function _compareArray( a, b ) {
        if( a.length!=b.length ) return false;

        var i = 0;
        a.forEach( function(e) {
            if( e != b[i++] ) return false;
        });
        return true;
    }


    function _toBeTruthy() {

        if( condition ) return;

        var msg =  "expect true but is false" ;
        throw new Error(msg);

    }
    function _toBeFalsy() {

        if( !condition ) return;

        var msg =  "expect false but is true" ;
        throw new Error(msg);

    }
    function _toBeNull() {

            if( condition==null ) return;

            var msg =  "expect null but is " + condition ;
            throw new Error(msg);

    }
    function _toBeNotNull() {
            print( "\n_toBeNotNull", condition );
            if( condition!=null ) return;

            var msg =  "expect not null but is null" ;
            throw new Error(msg);

    }
    function _toBeDefined() {
        if( condition != undefined ) return;

        var msg =  "expect defined but is undefined" ;
        throw new Error(msg);
    }
    function _toBeUndefined() {
        if( condition == 'undefined' || condition === undefined ) return;

        var msg =  "expect undefined but is " + condition ;
        throw new Error(msg);
    }

    return {

        not: {
            toBeTruthy:function() {
                return _toBeFalsy();
            },
            toBeFalsy:function() {
                return _toBeTruthy();
            },
            toBeNull:function() {
                return _toBeNotNull();
            },
            toBeDefined:function() {
                return _toBeUndefined();
            }
        },
        toBeNull:function() {
            return _toBeNull();
        },
        toBe:function(c) {
            if( c == condition || c === condition ) return;
            if( typeof c == 'string' && c == java.lang.String.valueOf(condition))  return;

            var msg =  "expect ["+ c + "] but is ["+condition+"]" ;
            throw new Error(msg);
        },
        toBeTruthy:function() {
            _toBeTruthy();
        },
        toBeFalsy:function() {
            _toBeFalsy();
        },
        toThrow:function(c) {
            try {
                condition();
            }
            catch(ex) {
                if( ex.message != c.message ) {
                    var msg =  "expect ["+c.message+"] exception but is ["+ex.message+"]" ;
                    throw new Error(msg);
                }
                return;
            }

            var msg =  "expect exception but none" ;
            throw new Error(msg)
        },
        toBeDefined:function() {
            _toBeDefined();
        },
        toEqual:function(c) {

            if( typeof c != typeof condition ) {
                throw new Error("exspected type ["+(typeof c)+"] is different  from given ["+(typeof condition)+"]" );
            }

            if( typeof c == 'object') {
                if( _compareArray( c, condition ) ) return;
            }

            if( c == condition ) {
                return;
            }

            var msg =  "expect ["+c+"] exception but is ["+condition+"]" ;
            throw new Error(msg);
        }
    }
}


function report() {

    jasmine.printReport();

    out.flush();
    System.out.println( writer.toString() );

    if( jasmine.nFail > 0 ) {
        throw new Error( "TEST FAILED!");
    }
}
