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
package org.javascript.rhino;


import java.io.IOException;
import java.io.Reader;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.BiFunction;
import java.util.function.Function;

import javax.script.Bindings;
import javax.script.Invocable;
import javax.script.ScriptContext;
import javax.script.ScriptEngineFactory;
import javax.script.ScriptException;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.Wrapper;
import static java.lang.String.format;

/**
 *
 * @author softphone
 *
 */
public class JSR223RhinoScriptEngine extends javax.script.AbstractScriptEngine implements Invocable {

    public final ContextFactory contextFactory = new ContextFactory();

    public final ScriptableObject topLevel;

    protected final Map<String, Class<?>> beans = new HashMap<String, Class<?>>(10);

    private ClassLoader applicationClassLoader;

    public final ClassLoader getApplicationClassLoader() {
        return applicationClassLoader;
    }

    public final void setApplicationClassLoader(ClassLoader applicationClassLoader) {
        this.applicationClassLoader = applicationClassLoader;
    }

    private final ContextFactory.Listener cxListener = new ContextFactory.Listener() {

        @Override
        public void contextCreated(Context cx) {
            cx.setOptimizationLevel(-1);

        }

        @Override
        public void contextReleased(Context cx) {
        }

    };

    /**
     *
     * @param classloader
     * @param factory
     */
    public JSR223RhinoScriptEngine(ClassLoader classloader, BiFunction<Context, javax.script.ScriptEngine, ScriptableObject> factory) {
        super();
        if (factory == null) {
            throw new java.lang.IllegalArgumentException("factory is null!");
        }

        if (classloader != null) {
            contextFactory.initApplicationClassLoader(classloader);
        }

        contextFactory.addListener(cxListener);

        this.topLevel = (ScriptableObject) contextFactory.call((Context cx) -> {

            return factory.apply(cx, this);

        });

    }

    @SuppressWarnings("unchecked")
    public static final <T> T callInContext(ContextFactory factory, Function<Context, T> f) {

        return (T) factory.call((Context cx) -> {
            return f.apply(cx);
        });

    }

    public final <T> T callInContext(Function<Context, T> f) {

        return callInContext(contextFactory, f);

    }

    public final Scriptable convertMapToJSObject(final Map<String, ? extends Object> map) {

        if (map == null) {
            throw new IllegalArgumentException("map parameter is null!");
        }

        return callInContext((ctx) -> {

            final Scriptable val = ctx.newArray(topLevel, map.size());

            int index = 0;
            for (Map.Entry<String, ? extends Object> e : map.entrySet()) {

                val.put(e.getKey(), val, e.getValue());
                if (map instanceof LinkedHashMap) {
                    val.put(index++, val, e.getValue());
                }
            }

            return val;

        });

    }

    private ScriptableObject topLevelProto() {
        return (ScriptableObject) ScriptableObject.getObjectPrototype(topLevel);
        //return topLevel;
    }
    
    private void putBean(final String name, final Object bean) {
        if (bean == null) {
            return;
        }

        callInContext((ctx) -> {

            final ScriptableObject objProto = topLevelProto();

            if (bean instanceof Scriptable) {
                ScriptableObject.putProperty(objProto, name, bean);
                return null;
            }

            if (bean instanceof Map) {

                try {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> map = (Map<String, Object>) bean;
                    Scriptable val = convertMapToJSObject(map);
                    ScriptableObject.putProperty(objProto, name, val);
                    return null;
                } catch (ClassCastException e) {
                    //logger.warn( "map is not of type map<String,Object>");
                }
            }

            final Object scriptWrap = Context.javaToJS(bean, objProto);
            ScriptableObject.putProperty(objProto, name, scriptWrap);

            return null;
        }
        );
    }

    /// JAVAX.SCRIPT.SCRIPENGINE
    @Override
    public Bindings createBindings() {
        return new javax.script.SimpleBindings();
    }

    @Override
    public Object eval(final String source, ScriptContext ctx) throws ScriptException {
        if (null == source) {
            throw new IllegalArgumentException("parameter reader is null");
        }

        return callInContext((context) -> {
            return context.evaluateString(topLevel, source, "", 1, null);
        }
        );
    }

    @Override
    public Object eval(final Reader source, final ScriptContext ctx) throws ScriptException {

        if (null == source) {
            throw new IllegalArgumentException("parameter reader is null");
        }

        return callInContext((context) -> {

            try {
                return context.evaluateReader(topLevel, source, "", 1, null);
            } catch (IOException e) {
                throw new RuntimeException("Error evaluating script from reader", e);
            }

        });
    }

    @Override
    public Object get(String key) {

        Object result = ScriptableObject.getProperty(topLevel, key);

        final Class<?> clazz = beans.get(key);

        return (clazz != null) ? Context.jsToJava(result, clazz) : result;
    }

    @Override
    public void put(String key, Object value) {
        putBean(key, value);
        beans.put(key, value.getClass());

    }

    /// JAVAX.SCRIPT.INVOCABLE
    protected Object[] wrapArguments(Object[] args) {
        if (args == null) {
            return Context.emptyArgs;
        }
        Object[] res = new Object[args.length];
        for (int i = 0; i < res.length; i++) {
            res[i] = Context.javaToJS(args[i], topLevel);
        }
        return res;
    }

    protected Object unwrapReturnValue(Object result) {
        if (result instanceof Wrapper) {
            result = ((Wrapper) result).unwrap();
        }

        return result instanceof Undefined ? null : result;
    }

    @Override
    public Object invokeMethod(Object thiz, final String name, final Object... args)
            throws ScriptException, NoSuchMethodException {

        if (thiz == null) {
            throw new java.lang.IllegalArgumentException("thiz is null!");
        }

        if (name == null) {
            throw new java.lang.IllegalArgumentException("method name is null");
        }

        if (!(thiz instanceof Scriptable)) {
            thiz = Context.toObject(thiz, topLevel);
        }

        final Scriptable localScope = (Scriptable) thiz;

        final Object obj = ScriptableObject.getProperty(localScope, name);
        if (!(obj instanceof org.mozilla.javascript.Function)) {
            throw new NoSuchMethodException("no such method: " + name);
        }

        return callInContext((cx) -> {
            final org.mozilla.javascript.Function func = (org.mozilla.javascript.Function) obj;

            Scriptable parentScope = func.getParentScope();
            if (parentScope == null) {
                parentScope = topLevelProto();
            }

            Object result = func.call(cx, parentScope, localScope, wrapArguments(args));
            return unwrapReturnValue(result);

        });

    }

    @Override
    public Object invokeFunction(String name, Object... args) throws ScriptException {
        if (name == null) {
            throw new java.lang.IllegalArgumentException("method name is null");
        }

        try {
            return callInContext((cx) -> {

                final Scriptable localScope = cx.newObject(topLevel);
                localScope.setPrototype(topLevel);
                localScope.setParentScope(null);

                //final Scriptable localScope = getRuntimeScope(context);                                             
                //final Scriptable localScope =  topLevel;
                final Object obj = ScriptableObject.getProperty(localScope, name);
                if (!(obj instanceof org.mozilla.javascript.Function)) {
                    throw new RuntimeException(new ScriptException(format("no such method: %s", name)));
                }

                final org.mozilla.javascript.Function func = (org.mozilla.javascript.Function) obj;

                Scriptable parentScope = func.getParentScope();
                if (parentScope == null) {
                    parentScope = topLevelProto();
                }

                Object result = func.call(cx, parentScope, localScope, wrapArguments(args));
                return unwrapReturnValue(result);

            });
        } catch (Exception e) {
            if( e.getCause() instanceof ScriptException ) {
                throw (ScriptException)e.getCause();
            }
            throw new ScriptException(e);
        }
    }

    @Override
    public ScriptEngineFactory getFactory() {
        throw new UnsupportedOperationException("getFactory() is not supported yet!");
    }

    @Override
    public <T> T getInterface(Class<T> clasz) {
        throw new UnsupportedOperationException("getInterface(Class) is not supported yet!");
    }

    @Override
    public <T> T getInterface(Object thiz, Class<T> clasz) {
        throw new UnsupportedOperationException("getInterface(Object,Clas) is not supported yet!");
    }

}
