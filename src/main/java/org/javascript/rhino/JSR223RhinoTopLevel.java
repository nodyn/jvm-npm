package org.javascript.rhino;


import javax.script.ScriptContext;
import javax.script.ScriptEngine;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

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
        
        final ScriptContext scx = (_this.engine != null ) ? _this.engine.getContext() : null;
        final java.io.PrintWriter w = ( scx != null ) ? 
                new java.io.PrintWriter( scx.getWriter() ) :
                new java.io.PrintWriter( System.out );

        _this._print(w, cx, args, funObj );
    }
    
    /**
     * 
     * @param cx
     * @param thisObj
     * @param args
     * @param funObj
     * @throws Exception 
     */
    public static void load(Context cx, Scriptable thisObj, Object[] args, Function funObj) throws Exception {
        
        final JSR223RhinoTopLevel _this = deref(thisObj);
        
        _this._load(cx, args, funObj );
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
