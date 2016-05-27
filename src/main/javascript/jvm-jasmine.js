
var out = java.lang.System.out;

var _nTest = 0;
var _nFail = 0;

function describe( msg, cb ) {
   
    out.println( msg );
    
    cb();
}

function it( msg, cb ) {
    ++_nTest;
    
    this.fail = function( m ) {
        throw new Error(m);
    } 
    
    out.printf( "\t%s", msg );
    
    try {
        cb(); 
        out.println(" ....passed");
    }
    catch( e ) {
        ++_nFail;
        out.printf(" ....error\n\n>>>\n%s\n<<<\n", e);
    }
}

function expect( condition ) {
  
    var f = ( typeof condition == 'function' ) ? 
                        condition : 
                        function() { return condition; }
    return { 
        
        toBe:function(c) {
            var ee = f();
            if( c == ee ) return;
            
            var msg =  "expect ["+ c + "] but is ["+ee+"]" ;              
            throw new Error(msg);
        },
        toBeTruthy:function(c) {
            var ee = f();
            if( ee ) return;
            
            var msg =  "expect true but is false" ;            
            throw new Error(msg);
            
        },
        toBeFalsy:function(c) {
            var ee = f();
            if( !ee ) return;
            
            var msg =  "expect false but is true" ;            
            throw new Error(msg);
            
        },
        toThrow:function(c) {
            try {
                f();                
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
            var ee = f();
            if( ee != undefined ) return;
            
            var msg =  "expect defined but is undefined" ;            
            throw new Error(msg);
            
        },
        toEqual:function(c) {
            //var ee = f();
            
            //var msg =  "... error. expect false but is true" ;            
            //throw new Error(msg);            
        }
    }
}


function report() {
    
    out.println("========================");
    out.printf( "report test/fail %d/%d\n", new java.lang.Integer(_nTest),  new java.lang.Integer(_nFail));
    out.println("========================");
}