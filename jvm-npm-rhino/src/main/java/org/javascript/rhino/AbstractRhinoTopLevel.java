/*
 * Copyright 2016 softphone.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.javascript.rhino;

import static java.lang.String.format;

import java.io.IOException;
import java.io.PrintWriter;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.ImporterTopLevel;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

/**
 *
 * @author softphone
 */
@SuppressWarnings("serial")
public abstract class AbstractRhinoTopLevel extends ImporterTopLevel {

    private static final String CLASSPATH_PREFIX = "classpath:";


	/**
     * 
     * @param <T>
     * @param thisObj
     * @return 
     */
    @SuppressWarnings("unchecked")
	protected static <T extends AbstractRhinoTopLevel> T deref(Scriptable thisObj) {
        AbstractRhinoTopLevel _this = null;

        if( thisObj instanceof AbstractRhinoTopLevel ) {
            _this = (AbstractRhinoTopLevel) thisObj;
        }
        else {

            final Scriptable protoObj = thisObj.getPrototype();
            if( protoObj instanceof AbstractRhinoTopLevel ) {
                _this = (AbstractRhinoTopLevel) protoObj;
            }
            else {
                throw new IllegalStateException( "cannot deref thisObj to  AbstractRhinoTopLevel!");
            }
        }
        
        return (T) _this;
    }


    /**
     * print function exported to javascript
     *
     * @param cx
     * @param thisObj
     * @param args
     * @param funObj
     */
    protected void _print(PrintWriter out, Context cx, Object[] args, Function funObj) {
        if (args == null) {
            return;
        }

        int row = 0;
        for (Object arg : args) {

            if (row++ > 0) {
                out.print(" ");
            }
            // Convert the arbitrary JavaScript value into a string form.
            out.print(Context.toString(arg));
        }

        out.println();
        out.flush();
    }
    
    private final java.util.Set<String> moduleCache = new java.util.HashSet<>();

    
    private String normalizeModuleName( String moduleName ) {

        if( moduleName.startsWith(CLASSPATH_PREFIX) ) {
            
            return moduleName.substring(CLASSPATH_PREFIX.length());
        }
        
        return moduleName;
        
        
    }
    /**
     * 
     * @param cx
     * @param module 
     */
    protected void _load(Context cx, Object[] args, Function funObj) throws Exception{
        if (args == null) {
            return;
        }

        for( Object arg :  args ) {
            
            final String module = normalizeModuleName(Context.toString(arg));

            if( moduleCache.contains(module)) {
                break;
            }

            final ClassLoader cl = Thread.currentThread().getContextClassLoader();

            final java.io.InputStream is = cl.getResourceAsStream(module);
            if (is != null) {

                try {
                    cx.evaluateReader(this, new java.io.InputStreamReader(is), module, 0, null);

                    moduleCache.add( module );

                } catch (IOException e) {
                    throw new Exception(format("error evaluating module [%s]", module), e);
                }

            } else { // Fallback

                final java.io.File file = new java.io.File(module);

                if (!file.exists()) {
                    throw new Exception(format("module [%s] doesn't exist!", module));
                }
                if (!file.isFile()) {
                    throw new Exception(format("module [%s] is not a file exist!", module));
                }

                try( java.io.FileReader reader = new java.io.FileReader(file) ) {

                    cx.evaluateReader(this, reader, module, 0, null);

                    moduleCache.add( module );

                } catch (IOException e) {
                    throw new Exception(format("error evaluating module [%s]", module), e);
                }

            }
        }
    }
    
    /**
     *
     * @param cx
     * @param sealed
     */
    public AbstractRhinoTopLevel(Context cx) {
        this(cx, false);
    }

    /**
     *
     * @param cx
     * @param sealed
     */
    public AbstractRhinoTopLevel(Context cx, boolean sealed) {
        super(cx, sealed);

    }

    @Override
    public void initStandardObjects(Context cx, boolean sealed) {
        super.initStandardObjects(cx, sealed);
        final String[] names = { "print", "load"};

        defineFunctionProperties(names, getClass(), ScriptableObject.DONTENUM);

        final ScriptableObject objProto = (ScriptableObject) getObjectPrototype(this);
        objProto.defineFunctionProperties(names, getClass(), DONTENUM);

    }
    
}
