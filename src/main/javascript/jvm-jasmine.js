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

var rpt = {
    nTest:0,
    nFail:0,   
    print:function() {
        out.println();
        out.println("========================");
        out.printf( "report test/fail %d/%d\n", new Integer(rpt.nTest),  new Integer(rpt.nFail));
        out.println("========================");
        out.println();       
    }
};

function describe( msg, cb ) {
   
    out.println( msg );
    
    cb();
}

function it( msg, cb ) {
    ++rpt.nTest;
    
    this.fail = function( m ) {
        throw new Error(m);
    } 
    
    out.printf( "\t%s", msg );
    
    try {
        cb(); 
        out.println(" ....passed");
    }
    catch( e ) {
        ++rpt.nFail;
        out.printf(" ....error\n\n>>>\n%s\n<<<\n", e);
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
            }
        },
        toBeNull:function() {
            return _toBeNull();
        },
        toBe:function(c) {
            if( c == condition ) return;
            
            var msg =  "expect ["+ c + "] but is ["+condition+"]" ;              
            throw new Error(msg);
        },
        toBeTruthy:function() {
            return _toBeTruthy();
        },
        toBeFalsy:function() {
            return _toBeFalsy();
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
            if( condition != undefined ) return;
            
            var msg =  "expect defined but is undefined" ;            
            throw new Error(msg);
            
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
    
    rpt.print();
    
    out.flush();
    System.out.println( writer.toString() );
    
    if( rpt.nFail > 0 ) {
        throw new Error( "TEST FAILED!");
    }
}