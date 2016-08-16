package org.javascript.rhino;


import java.nio.file.Path;
import java.nio.file.Paths;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import org.freedesktop.dbus.test.test;
import org.hamcrest.core.IsNull;
import org.junit.Test;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextAction;
import org.mozilla.javascript.ContextFactory;
import org.javascript.rhino.RhinoTopLevel;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Ignore;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.commonjs.module.provider.ModuleSourceProvider;


public class RhinoClassLoaderTest {

    ContextFactory contextFactory;

    final ContextFactory.Listener l = new ContextFactory.Listener() {

           @Override
           public void contextCreated(Context cx) {
               System.out.printf( "CONTEXT CREATED [%s] Thread [%d]\n", cx, Thread.currentThread().getId());
           }

           @Override
           public void contextReleased(Context cntxt) {
               System.out.printf( "CONTEXT RELEASED [%s] Thread [%d]\n", cntxt, Thread.currentThread().getId());
           }
        };
    
    
    String prevUserDir ;
    
    @Before
    public void initFactory() {
        
        prevUserDir = System.getProperty("user.dir");
        
        contextFactory = new ContextFactory();
    
        contextFactory.addListener( l );
        
    }

    @After
    public void releaseFactory() {
        
        contextFactory.removeListener( l );
        
        contextFactory = null;

         System.setProperty("user.dir", prevUserDir);
    }
    
    @Ignore
    @Test
    public void dummy() {

    }    

    
    @Test
    public void rhino_npm_js_cl_test(){
        

        final ModuleSourceProvider sourceProvider = new RhinoModuleSourceClassLoaderProvider();

        contextFactory.call( new ContextAction() {
           
            @Override
            public Object run(Context cx) {
                final RhinoTopLevel topLevel = new RhinoTopLevel(cx);
                
                // clone scope
                Scriptable newScope = cx.newObject(topLevel);
                newScope.setPrototype(topLevel);
                //newScope.setParentScope(null);
                
                //RhinoTopLevel.installNativeRequire(cx, newScope, topLevel, sourceProvider);
                RhinoTopLevel.loadModule(cx, newScope, "src/test/javascript/specs/rhino-npm-cl-requireSpec.js");
                
                return newScope;
           }
        });
     
    }
    
    @Test
    public void rhino_jsr223_npm_js_cl_test() throws ScriptException{
        final ScriptEngineManager manager = new ScriptEngineManager();
        final ScriptEngine rhino = manager.getEngineByName("rhino-npm");

        Assert.assertThat(rhino , IsNull.notNullValue());
        
        rhino.eval( "load('src/test/javascript/specs/rhino-npm-cl-requireSpec.js');" );

        
    }
    
    public static void main( String args[] ) throws Exception {
        RhinoClassLoaderTest test = new RhinoClassLoaderTest();
        
        test.initFactory();
        
        try {
            test.rhino_npm_js_cl_test();
        }
        finally {
            test.releaseFactory();
        }
    }
}
