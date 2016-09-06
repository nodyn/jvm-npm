/*
 * Copyright (C) 2006 Sun Microsystems, Inc. All rights reserved. 
 * Use is subject to license terms.
 *
 * Redistribution and use in source and binary forms, with or without modification, are 
 * permitted provided that the following conditions are met: Redistributions of source code 
 * must retain the above copyright notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list of 
 * conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution. Neither the name of the Sun Microsystems nor the names of 
 * is contributors may be used to endorse or promote products derived from this software 
 * without specific prior written permission. 

 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
 * OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY 
 * AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER 
 * OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR 
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON 
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
 * OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
 
package com.sun.phobos.script.javascript;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.NativeJavaArray;
import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

/**
 * JSAdapter is java.lang.reflect.Proxy equivalent for JavaScript. JSAdapter
 * calls specially named JavaScript methods on an adaptee object when property
 * access is attempted on it.
 *
 * Example:
 *
 *    var y = {
 *                __get__    : function (name) { ... }
 *                __has__    : function (name) { ... }
 *                __put__    : function (name, value) {...}
 *                __delete__ : function (name) { ... }
 *                __getIds__ : function () { ... }
 *            };
 *
 *    var x = new JSAdapter(y);
 *
 *    x.i;                        // calls y.__get__
 *    i in x;                     // calls y.__has__
 *    x.p = 10;                   // calls y.__put__
 *    delete x.p;                 // calls y.__delete__
 *    for (i in x) { print(i); }  // calls y.__getIds__
 *
 * If a special JavaScript method is not found in the adaptee, then JSAdapter
 * forwards the property access to the adaptee itself.
 *
 * JavaScript caller of adapter object is isolated from the fact that
 * the property access/mutation/deletion are really calls to
 * JavaScript methods on adaptee.  Use cases include 'smart'
 * properties, property access tracing/debugging, encaptulation with
 * easy client access - in short JavaScript becomes more "Self" like.
 *
 * Note that Rhino already supports special properties like __proto__
 * (to set, get prototype), __parent__ (to set, get parent scope). We
 * follow the same double underscore nameing convention here. Similarly
 * the name JSAdapter is derived from JavaAdapter -- which is a facility
 * to extend, implement Java classes/interfaces by JavaScript.
 *
 * @version 1.0
 * @author A. Sundararajan
 * @since 1.6
 */
public final class JSAdapter implements Scriptable, Function {
    private JSAdapter(Scriptable obj) {
        setAdaptee(obj);
    }
    
    // initializer to setup JSAdapter prototype in the given scope
    public static void init(Context cx, Scriptable scope, boolean sealed)
    throws RhinoException {
        JSAdapter obj = new JSAdapter(cx.newObject(scope));
        obj.setParentScope(scope);
        obj.setPrototype(getFunctionPrototype(scope));
        obj.isPrototype = true;
        ScriptableObject.defineProperty(scope, "JSAdapter",  obj,
                ScriptableObject.DONTENUM);
    }
    
    public String getClassName() {
        return "JSAdapter";
    }
    
    public Object get(String name, Scriptable start) {
        Function func = getAdapteeFunction(GET_PROP);
        if (func != null) {
            return call(func, new Object[] { name });
        } else {
            start = getAdaptee();
            return start.get(name, start);
        }
    }
    
    public Object get(int index, Scriptable start) {
        Function func = getAdapteeFunction(GET_PROP);
        if (func != null) {
            return call(func, new Object[] { new Integer(index) });
        } else {
            start = getAdaptee();
            return start.get(index, start);
        }
    }
    
    public boolean has(String name, Scriptable start) {
        Function func = getAdapteeFunction(HAS_PROP);
        if (func != null) {
            Object res = call(func, new Object[] { name });
            return Context.toBoolean(res);
        } else {
            start = getAdaptee();
            return start.has(name, start);
        }
    }
    
    public boolean has(int index, Scriptable start) {
        Function func = getAdapteeFunction(HAS_PROP);
        if (func != null) {
            Object res = call(func, new Object[] { new Integer(index) });
            return Context.toBoolean(res);
        } else {
            start = getAdaptee();
            return start.has(index, start);
        }
    }
    
    public void put(String name, Scriptable start, Object value) {
        if (start == this) {
            Function func = getAdapteeFunction(PUT_PROP);
            if (func != null) {
                call(func, new Object[] { name, value });
            } else {
                start = getAdaptee();
                start.put(name, start, value);
            }
        } else {
            start.put(name, start, value);
        }
    }
    
    public void put(int index, Scriptable start, Object value) {
        if (start == this) {
            Function func = getAdapteeFunction(PUT_PROP);
            if( func != null) {
                call(func, new Object[] { new Integer(index), value });
            } else {
                start = getAdaptee();
                start.put(index, start, value);
            }
        } else {
            start.put(index, start, value);
        }
    }
    
    public void delete(String name) {
        Function func = getAdapteeFunction(DEL_PROP);
        if (func != null) {
            call(func, new Object[] { name });
        } else {
            getAdaptee().delete(name);
        }
    }
    
    public void delete(int index) {
        Function func = getAdapteeFunction(DEL_PROP);
        if (func != null) {
            call(func, new Object[] { new Integer(index) });
        } else {
            getAdaptee().delete(index);
        }
    }
    
    public Scriptable getPrototype() {
        return prototype;
    }
    
    public void setPrototype(Scriptable prototype) {
        this.prototype = prototype;
    }
    
    public Scriptable getParentScope() {
        return parent;
    }
    
    public void setParentScope(Scriptable parent) {
        this.parent = parent;
    }
    
    public Object[] getIds() {
        Function func = getAdapteeFunction(GET_PROPIDS);
        if (func != null) {
            Object val = call(func, new Object[0]);
            // in most cases, adaptee would return native JS array
            if (val instanceof NativeArray) {
                NativeArray array = (NativeArray) val;
                Object[] res = new Object[(int)array.getLength()];
                for (int index = 0; index < res.length; index++) {
                    res[index] = mapToId(array.get(index, array));
                }
                return res;
            } else if (val instanceof NativeJavaArray) {
                // may be attempt wrapped Java array
                Object tmp = ((NativeJavaArray)val).unwrap();
                Object[] res;
                if (tmp.getClass() == Object[].class) {
                    Object[]  array = (Object[]) tmp;
                    res = new Object[array.length];
                    for (int index = 0; index < array.length; index++) {
                        res[index] = mapToId(array[index]);
                    }
                } else {
                    // just return an empty array
                    res = Context.emptyArgs;
                }
                return res;
            } else {
                // some other return type, just return empty array
                return Context.emptyArgs;
            }
        } else {
            return getAdaptee().getIds();
        }
    }
    
    public boolean hasInstance(Scriptable scriptable) {
        if (scriptable instanceof JSAdapter) {
            return true;
        } else {
            Scriptable proto = scriptable.getPrototype();
            while (proto != null) {
                if (proto.equals(this)) return true;
                proto = proto.getPrototype();
            }
            return false;
        }
    }
    
    public Object getDefaultValue(Class hint) {
        return getAdaptee().getDefaultValue(hint);
    }
    
    public Object call(Context cx, Scriptable scope, Scriptable thisObj,
            Object[] args)
            throws RhinoException {
        if (isPrototype) {
            return construct(cx, scope, args);
        } else {
            Scriptable tmp = getAdaptee();
            if (tmp instanceof Function) {
                return ((Function)tmp).call(cx, scope, tmp, args);
            } else {
                throw Context.reportRuntimeError("TypeError: not a function");
            }
        }
    }
    
    public Scriptable construct(Context cx, Scriptable scope, Object[] args)
    throws RhinoException {
        if (isPrototype) {
            Scriptable topLevel = ScriptableObject.getTopLevelScope(scope);
            JSAdapter newObj;
            if (args.length > 0) {
                newObj = new JSAdapter(Context.toObject(args[0], topLevel));
            } else {
                throw Context.reportRuntimeError("JSAdapter requires adaptee");
            }
            return newObj;
        } else {
            Scriptable tmp = getAdaptee();
            if (tmp instanceof Function) {
                return ((Function)tmp).construct(cx, scope, args);
            } else {
                throw Context.reportRuntimeError("TypeError: not a constructor");
            }
        }
    }
    
    public Scriptable getAdaptee() {
        return adaptee;
    }
    
    public void setAdaptee(Scriptable adaptee) {
        if (adaptee == null) {
            throw new NullPointerException("adaptee can not be null");
        }
        this.adaptee = adaptee;
    }
    
    //-- internals only below this point
    
    // map a property id. Property id can only be an Integer or String
    private Object mapToId(Object tmp) {
        if (tmp instanceof Double) {
            return new Integer(((Double)tmp).intValue());
        } else {
            return Context.toString(tmp);
        }
    }
    
    private static Scriptable getFunctionPrototype(Scriptable scope) {
        return ScriptableObject.getFunctionPrototype(scope);
    }
    
    private Function getAdapteeFunction(String name) {
        Object o = ScriptableObject.getProperty(getAdaptee(), name);
        return (o instanceof Function)? (Function)o : null;
    }
    
    private Object call(Function func, Object[] args) {
        Context cx = Context.getCurrentContext();
        Scriptable thisObj = getAdaptee();
        Scriptable scope = func.getParentScope();
        try {
            return func.call(cx, scope, thisObj, args);
        } catch (RhinoException re) {
            throw Context.reportRuntimeError(re.getMessage());
        }
    }
    
    private Scriptable prototype;
    private Scriptable parent;
    private Scriptable adaptee;
    private boolean isPrototype;
    
    // names of adaptee JavaScript functions
    private static final String GET_PROP = "__get__";
    private static final String HAS_PROP = "__has__";
    private static final String PUT_PROP = "__put__";
    private static final String DEL_PROP = "__delete__";
    private static final String GET_PROPIDS = "__getIds__";
}
