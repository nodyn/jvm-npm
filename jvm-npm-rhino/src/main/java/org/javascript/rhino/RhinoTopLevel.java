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
import java.nio.file.Path;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Script;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.commonjs.module.ModuleScriptProvider;
import org.mozilla.javascript.commonjs.module.Require;
import org.mozilla.javascript.commonjs.module.RequireBuilder;
import org.mozilla.javascript.commonjs.module.provider.ModuleSourceProvider;
import org.mozilla.javascript.commonjs.module.provider.StrongCachingModuleScriptProvider;

/**
 *
 * @author softphone
 */
@SuppressWarnings("serial")
public class RhinoTopLevel extends AbstractRhinoTopLevel {


    /**
     * print function exported to javascript
     *
     * @param cx
     * @param thisObj
     * @param args
     * @param funObj
     */
    public static void print(Context cx, Scriptable thisObj, Object[] args, Function funObj) {
        
        final RhinoTopLevel _this = deref(thisObj);
        
        final PrintWriter w = new PrintWriter(System.out);
        
        _this._print( w, cx, args, funObj );
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
        
        final RhinoTopLevel _this = deref(thisObj);
        
        _this._load(cx, args, funObj );
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

    public static void loadModule(Context cx, Scriptable scope, Path modulePath) {

        try (java.io.FileReader module = new java.io.FileReader( modulePath.toFile() ) ) {

            cx.evaluateReader(scope, module, modulePath.toString(), 0, null);
        } catch (IOException e) {
            throw new RuntimeException(format("error evaluating [%s]!", modulePath.toString()), e);
        }
    }

    public static void installNativeRequire(Context cx, Scriptable globalScope, Scriptable scope,  final ModuleSourceProvider sourceProvider) {

        final ModuleScriptProvider scriptProvider = new StrongCachingModuleScriptProvider(sourceProvider);

        final Script preExec = null;
        final Script postExec = null;
        final boolean sandboxed = false;

        final Require require = new RequireBuilder()
                .setPreExec(preExec)
                .setPostExec(postExec)
                .setModuleScriptProvider(scriptProvider)
                .setSandboxed(sandboxed)
                .createRequire(cx, globalScope);

        require.install(scope);

    }
/*
    @Override
    public void initStandardObjects(Context cx, boolean sealed) {
        super.initStandardObjects(cx, sealed);
        final String[] names = { "print", "load"};

        defineFunctionProperties(names, getClass(), ScriptableObject.DONTENUM);

        final ScriptableObject objProto = (ScriptableObject) getObjectPrototype(this);
        objProto.defineFunctionProperties(names, getClass(), DONTENUM);

    }
*/
}
