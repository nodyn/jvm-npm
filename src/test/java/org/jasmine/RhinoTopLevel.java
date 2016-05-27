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
package org.jasmine;

import java.io.IOException;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ImporterTopLevel;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import static org.mozilla.javascript.ScriptableObject.DONTENUM;
import static java.lang.String.format;
import java.nio.file.Path;
import java.nio.file.Paths;
import static org.jasmine.Console.err;
import static org.jasmine.Console.log;
import org.mozilla.javascript.Function;

/**
 *
 * @author softphone
 */
public class RhinoTopLevel extends ImporterTopLevel {

    
    /**
     * print function exported to javascript
     *
     * @param cx
     * @param thisObj
     * @param args
     * @param funObj
     */
    public static void print(Context cx, Scriptable thisObj, Object[] args, Function funObj) {
        if (args == null) {
            return;
        }

        int row = 0;
        for (Object arg : args) {

            if (row++ > 0) {
                System.out.print(" ");
            }
            // Convert the arbitrary JavaScript value into a string form.
            System.out.print(Context.toString(arg));
        }

        System.out.println();
    }

    /**
     * Load and execute a set of JavaScript source files.
     *
     * This method is defined as a JavaScript function.
     *
     */
    public static void load(Context cx, Scriptable thisObj, Object[] args, Function funObj) throws Exception {
        if (args == null) {
            return;
        }

        for (Object a : args) {

            final String module = Context.toString(a);
            
            ((RhinoTopLevel) thisObj)._load(cx, module);
        }
    }

    private java.util.Set<String> moduleCache = new java.util.HashSet<>();
    
    private void _load(Context cx, String module) {
        
        if( moduleCache.contains(module)) {
            return;
        }
        
        log( "loading module [%s]", module);
        
        final ClassLoader cl = Thread.currentThread().getContextClassLoader();
        
        final java.io.InputStream is = cl.getResourceAsStream(module);

        if (is != null) {

            try {
                cx.evaluateReader(this, new java.io.InputStreamReader(is), module, 0, null);
                
                moduleCache.add( module );
                
            } catch (IOException e) {
                err("error evaluating module [%s]", module, e);
                return;
            }

        } else { // Fallback

            java.io.File file = new java.io.File(module);

            if (!file.exists()) {
                err("module [%s] doesn't exist!", module);
                return;

            }
            if (!file.isFile()) {
                err("module [%s] is not a file exist!", module);
                return;

            }

            try {
                final java.io.FileReader reader = new java.io.FileReader(file);

                cx.evaluateReader(this, reader, module, 0, null);

            } catch (IOException e) {
                err("error evaluating module [%s]", module, e);
                return;
            }

        }
    }

    /**
     *
     * @param cx
     * @param sealed
     */
    public RhinoTopLevel(Context cx) {
        this(cx, false);
    }

    /**
     *
     * @param cx
     * @param sealed
     */
    public RhinoTopLevel(Context cx, boolean sealed) {
        super(cx, sealed);
        
    }

    private void loadJVMNPM(Context cx) {
        final String moduleName = "src/main/javascript/jvm-npm.js";
        
        try (java.io.FileReader module = new java.io.FileReader( moduleName ) ) {

            cx.evaluateReader(this, module, moduleName, 0, null);

            moduleCache.add(moduleName);
        } catch (IOException e) {
            throw new RuntimeException(format("error evaluating [%s]!", moduleName), e);
        }
        
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
