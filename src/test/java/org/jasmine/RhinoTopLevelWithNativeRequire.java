package org.jasmine;

import java.io.IOException;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ImporterTopLevel;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import static org.mozilla.javascript.ScriptableObject.DONTENUM;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Script;
import org.mozilla.javascript.commonjs.module.ModuleScriptProvider;
import org.mozilla.javascript.commonjs.module.Require;
import org.mozilla.javascript.commonjs.module.RequireBuilder;
import org.mozilla.javascript.commonjs.module.provider.ModuleSourceProvider;
import org.mozilla.javascript.commonjs.module.provider.StrongCachingModuleScriptProvider;
import static org.jasmine.Console.*;
/**
 *
 * @author softphone
 */
public class RhinoTopLevelWithNativeRequire extends ImporterTopLevel {

    
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

            
            ((RhinoTopLevelWithNativeRequire) thisObj)._load(cx, module);
        }
    }

    private void _load(Context cx, String module) {
        
        log( "loading module [%s]", module);
        
        final ClassLoader cl = Thread.currentThread().getContextClassLoader();
        
        final java.io.InputStream is = cl.getResourceAsStream(module);

        if (is != null) {

            try (final java.io.InputStreamReader r = new java.io.InputStreamReader(is) ) {
                
                cx.evaluateReader(this, r , module, 0, null);
                
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

            try (final java.io.FileReader reader = new java.io.FileReader(file) ) {

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
    public RhinoTopLevelWithNativeRequire(Context cx) {
        this(cx, false);
    }

    /**
     *
     * @param cx
     * @param sealed
     */
    public RhinoTopLevelWithNativeRequire(Context cx, boolean sealed) {
        super(cx, sealed);
        
        installNativeRequire(cx, this, this);

    }
    
    private void installNativeRequire(Context cx, Scriptable globalScope, Scriptable scope) {
        final ModuleSourceProvider sourceProvider = new RhinoModuleSourceProvider();
        
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
    @Override
    public void initStandardObjects(Context cx, boolean sealed) {
        super.initStandardObjects(cx, sealed);
        final String[] names = { "print", "load"};

        final ScriptableObject objProto = (ScriptableObject) getObjectPrototype(this);
        objProto.defineFunctionProperties(names, getClass(), DONTENUM);
        
        defineFunctionProperties(names, getClass(), ScriptableObject.DONTENUM);
        
        
    }

}
