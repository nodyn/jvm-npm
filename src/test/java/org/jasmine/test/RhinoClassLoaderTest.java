package org.jasmine.test;


import java.nio.file.Path;
import java.nio.file.Paths;
import org.freedesktop.dbus.test.test;
import org.javascript.rhino.RhinoModuleSourceClassLoaderProvider;
import org.junit.Test;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextAction;
import org.mozilla.javascript.ContextFactory;
import org.javascript.rhino.RhinoTopLevel;
import org.junit.After;
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
