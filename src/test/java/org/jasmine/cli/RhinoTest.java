
import java.io.IOException;
import org.junit.Test;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextAction;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.Scriptable;
import static java.lang.String.format;
import org.jasmine.RhinoTopLevelWithNativeRequire;
import org.junit.Ignore;

public class RhinoTest {

    private void loadModule(Context cx, Scriptable scope, String moduleName) {

        try (java.io.FileReader module = new java.io.FileReader( moduleName ) ) {

            cx.evaluateReader(scope, module, moduleName, 0, null);
        } catch (IOException e) {
            throw new RuntimeException(format("error evaluating [%s]!", moduleName), e);
        }
    }
        
    @Ignore
    @Test
    public void rhino_npm_js_test(){
        final ContextFactory contextFactory = new ContextFactory();
       
                
        contextFactory.addListener( new ContextFactory.Listener() {

           @Override
           public void contextCreated(Context cx) {
               System.out.printf( "CONTEXT CREATED [%s] Thread [%d]\n", cx, Thread.currentThread().getId());
           }

           @Override
           public void contextReleased(Context cntxt) {
               System.out.printf( "CONTEXT RELEASED [%s] Thread [%d]\n", cntxt, Thread.currentThread().getId());
           }
        });

        
        contextFactory.call( new ContextAction() {
           
            @Override
            public Object run(Context cx) {
                final RhinoTopLevelWithNativeRequire topLevel = new RhinoTopLevelWithNativeRequire(cx);
                //final RhinoTopLevel topLevel = new RhinoTopLevel(cx);
                
                loadModule(cx, topLevel, "src/test/javascript/specs/rhino-npm-requireSpec.js");
                
                return topLevel;
           }
        });
        
    }

    @Test
    public void rhino_npm_native_test(){
        final ContextFactory contextFactory = new ContextFactory();
       
                
        contextFactory.addListener( new ContextFactory.Listener() {

           @Override
           public void contextCreated(Context cx) {
               System.out.printf( "CONTEXT CREATED [%s] Thread [%d]\n", cx, Thread.currentThread().getId());
           }

           @Override
           public void contextReleased(Context cntxt) {
               System.out.printf( "CONTEXT RELEASED [%s] Thread [%d]\n", cntxt, Thread.currentThread().getId());
           }
        });

        
        contextFactory.call( new ContextAction() {
           
            @Override
            public Object run(Context cx) {
                final RhinoTopLevelWithNativeRequire topLevel = new RhinoTopLevelWithNativeRequire(cx);
                //final RhinoTopLevel topLevel = new RhinoTopLevel(cx);
                
                loadModule(cx, topLevel, "src/test/javascript/specs/rhino-native-requireSpec.js");
                
                return topLevel;
           }
        });
        
    }
    
}
