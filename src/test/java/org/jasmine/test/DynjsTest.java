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

import org.dynjs.Config;
import org.dynjs.runtime.DynJS;
import org.junit.Ignore;
import org.junit.Test;

/**
 *
 * @author softphone
 */
public class DynjsTest {
    
   @Ignore
    @Test
    public void dummy() {

    }    

    
    @Test
    public void dynjs_npm_js_test(){
        Config config = new Config();
        config.setCompileMode(Config.CompileMode.OFF);
        config.setDebug(false);
        
        
        DynJS dynjs = new DynJS(config);
        
        dynjs.evaluate("require.addLoadPath('/')");
        dynjs.evaluate("load('src/main/javascript/jvm-jasmine.js');");
        dynjs.evaluate("load('src/test/javascript/specs/dynjs-npm-requireSpec.js');");
        
        dynjs.evaluate("report();");

    }
 }
