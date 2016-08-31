package org.javascript.rhino;


import static org.javascript.rhino.RhinoTopLevel.loadModule;

import java.nio.file.Path;
import java.nio.file.Paths;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;

import org.hamcrest.core.IsNull;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Ignore;
import org.junit.Test;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextAction;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.commonjs.module.provider.ModuleSourceProvider;

import static java.lang.String.format;

//@org.junit.runner.RunWith(MultiThreadedRunner.class)
public class RhinoTest {

	final String javascriptDir = Paths.get("src","test","javascript").toString();
    
	final Path jasmine					= Paths.get( javascriptDir, "jvm-jasmine.js");  
    final Path npmRequireSpecs			= Paths.get( javascriptDir,	"specs", "npm-requireSpec.js");
	final Path nativeRequireSpecs		= Paths.get( javascriptDir,	"specs", "native-requireSpec.js");
	final Path npmNativeRequireSpecs	= Paths.get( javascriptDir,	"specs", "npm-native-requireSpec.js");
	
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
    public void rhino_npm_js_test(){
        final ModuleSourceProvider sourceProvider = new RhinoModuleSourceProvider();
        contextFactory.call( new ContextAction() {

            @Override
            public Object run(Context cx) {
                final RhinoTopLevel topLevel = new RhinoTopLevel(cx);

                Scriptable newScope = cx.newObject(topLevel);
                newScope.setPrototype(topLevel);
                //newScope.setParentScope(null);

                RhinoTopLevel.installNativeRequire(cx, newScope, topLevel,sourceProvider);
                RhinoTopLevel.loadModule(cx, newScope, npmNativeRequireSpecs );

                return newScope;
           }
        });

    }

    @Test
    public void rhino_npm_native_test(){
        final ModuleSourceProvider sourceProvider = new RhinoModuleSourceProvider();

        contextFactory.call( new ContextAction() {

            @Override
            public Object run(Context cx) {
                final RhinoTopLevel topLevel = new RhinoTopLevel(cx);

                Scriptable newScope = cx.newObject(topLevel);
                newScope.setPrototype(topLevel);
                //newScope.setParentScope(null);

                RhinoTopLevel.installNativeRequire(cx, newScope, topLevel, sourceProvider);
                loadModule(cx, newScope, nativeRequireSpecs);

                return newScope;
           }
        });

    }

    @Test
    public void rhino_npm_only_js_test(){
        contextFactory.call( new ContextAction() {

            @Override
            public Object run(Context cx) {
                final RhinoTopLevel topLevel = new RhinoTopLevel(cx);

                Scriptable newScope = cx.newObject(topLevel);
                newScope.setPrototype(topLevel);
                //newScope.setParentScope(null);

                loadModule(cx, newScope, npmRequireSpecs);

                return newScope;
           }
        });


    }

    @Test
    public void rhino_jsr223_npm_js_test() throws ScriptException{
        final ScriptEngineManager manager = new ScriptEngineManager();
        final ScriptEngine rhino = manager.getEngineByName("rhino-npm");

        Assert.assertThat(rhino , IsNull.notNullValue());
        
        rhino.eval( format( "load('%s');", npmRequireSpecs) );
      
    }
    
    public static void main( String args[] ) throws Exception {
        RhinoTest test = new RhinoTest();
        
        test.initFactory();
        
        try {
            test.rhino_npm_only_js_test();
        }
        finally {
            test.releaseFactory();
        }
    }

}
