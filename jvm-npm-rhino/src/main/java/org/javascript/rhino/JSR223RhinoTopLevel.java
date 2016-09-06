package org.javascript.rhino;


import javax.script.ScriptEngine;
import javax.script.ScriptException;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;

@SuppressWarnings("serial")
public final class JSR223RhinoTopLevel extends AbstractRhinoTopLevel {

    final javax.script.ScriptEngine engine;
	
    /**
     * print function exported to javascript
     *
     * @param cx
     * @param thisObj
     * @param args
     * @param funObj
     */
    public static void print(Context cx, Scriptable thisObj, Object[] args, Function funObj) {
        
        final JSR223RhinoTopLevel _this = deref(thisObj);
        
        final java.io.Writer w = (_this.engine != null  && _this.engine.getContext() != null ) ? _this.engine.getContext().getWriter() : null;
        
        final java.io.PrintWriter writer = ( w != null ) ? 
                new java.io.PrintWriter( w ) :
                new java.io.PrintWriter( System.out );

        _this._print(writer, cx, args, funObj );
    }
    
    /**
     * 
     * @param cx
     * @param thisObj
     * @param args
     * @param funObj
     * @throws Exception 
     */
    public static void load(Context cx, Scriptable thisObj, Object[] args, Function funObj) throws ScriptException {
        
        final JSR223RhinoTopLevel _this = deref(thisObj);
        
        try {
        _this._load(cx, args, funObj );
        }
        catch( Exception ex ) {
        	throw new ScriptException(ex);
        }
    }
    
    /**
     * 
     * @param cx
     * @param sealed
     */
	public JSR223RhinoTopLevel(Context cx) {
		this(cx, false, null);
	}

    /**
     * 
     * @param cx
     * @param sealed
     */
	public JSR223RhinoTopLevel(Context cx, ScriptEngine engine) {
		this(cx, false, engine);		
	}
    /**
     * 
     * @param cx
     * @param sealed
     */
	public JSR223RhinoTopLevel(Context cx, boolean sealed, ScriptEngine engine) {
		super(cx, sealed);
		
		this.engine = engine;
		
	}
/*	
	public void initStandardObjects(Context cx, boolean sealed) {
	    super.initStandardObjects(cx, sealed);
		final String[] names = {  "print", "load" };

		defineFunctionProperties(names, getClass(),  ScriptableObject.DONTENUM);
		
		final ScriptableObject objProto = (ScriptableObject) getObjectPrototype(this);
	    objProto.defineFunctionProperties(names,  getClass(), DONTENUM);		
		
	}
*/
}
