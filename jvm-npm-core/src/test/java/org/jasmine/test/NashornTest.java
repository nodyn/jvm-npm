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
package org.jasmine.test;

import java.nio.file.Path;
import java.nio.file.Paths;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import org.hamcrest.core.IsEqual;
import org.hamcrest.core.IsNull;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Ignore;
import org.junit.Test;
import static java.lang.String.format;

/**
 *
 * @author softphone
 */
public class NashornTest {
	final String javascriptDir = Paths.get("src","test","javascript").toString();
    
	final Path jasmine					= Paths.get( javascriptDir, "jvm-jasmine.js");  
    final Path npmRequireSpecs			= Paths.get( javascriptDir,	"specs", "npm-requireSpec.js");
    final Path npmCLRequireSpecs		= Paths.get( javascriptDir,	"specs", "npm-cl-requireSpec.js");
	final Path nativeRequireSpecs		= Paths.get( javascriptDir,	"specs", "native-requireSpec.js");
	final Path npmNativeRequireSpecs	= Paths.get( javascriptDir,	"specs", "npm-native-requireSpec.js");
    
    ScriptEngineManager manager;

    @Ignore
    @Test
    public void dummy() {

    }

    String prevUserDir ;
    
    @Before
    public void initFactory() {
        
        prevUserDir = System.getProperty("user.dir");
        
        manager = new ScriptEngineManager();
        
        Assert.assertThat(manager , IsNull.notNullValue());

    }

    @After
    public void releaseFactory() {

        System.setProperty("user.dir", prevUserDir);
        
    }

    @Test
    public void nashorn_npm_js_test() throws ScriptException{
        final ScriptEngine nashorn = manager.getEngineByName("nashorn");

        Assert.assertThat(nashorn , IsNull.notNullValue());
        
        nashorn.eval( format("load('%s');", npmRequireSpecs) );

        
    }
    
    @Test
    public void nashorn_classloader_npm_js_test() throws ScriptException{
        final ScriptEngine nashorn = manager.getEngineByName("nashorn");

        Assert.assertThat(nashorn , IsNull.notNullValue());
        
        nashorn.eval( format("load('%s');", npmCLRequireSpecs) );

        
    }
    
    @Test
    public void nashorn_classloader_load_test() throws ScriptException{
        final ScriptEngine nashorn = manager.getEngineByName("nashorn");

        Assert.assertThat(nashorn , IsNull.notNullValue());
        
        
        final Object o = nashorn.eval( "load('classpath:java8/nashorn_test.js');" );
        
        Assert.assertThat( o, IsNull.notNullValue());
        Assert.assertThat( String.valueOf(o), IsEqual.equalTo("HELLO MODULE LOADED FORM CLASSPATH"));
    }
    
}
