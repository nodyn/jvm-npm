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

import org.hamcrest.core.Is;
import org.hamcrest.core.IsEqual;
import org.hamcrest.core.IsNull;
import org.junit.Assert;
import org.junit.Test;

/**
 *
 * @author softphone
 */
public class PathTest {
    
    @Test 
    public void normalize() {
        
        String p = "lib-cl/cyclic/./a.js"; 
        Path path = Paths.get( p );
        Assert.assertThat(path, IsNull.notNullValue());
        Assert.assertThat( path.normalize().toString(), IsEqual.equalTo("lib-cl/cyclic/a.js"));
    } 
    
    @Test 
    public void merge() {
        
        Path p[] = {
            Paths.get("lib-cl/cyclic/a.js"),
            Paths.get("lib-cl/cyclic/")
            
        };
        
        for( Path path : p) {
            Assert.assertThat(path, IsNull.notNullValue());          
        }
        
        
        Assert.assertThat( p[0].startsWith(p[1]), Is.is(true));
    } 
    
    @Test 
    public void relationship() {
        
        Path p[] = {
            Paths.get("lib-cl/cyclic/a.js"),
            Paths.get("lib-cl/cyclic/"),
            Paths.get("lib-cl"),
            Paths.get("/lib-cl/cyclic/"),
            Paths.get("/")
        };

        for( Path path : p) {
            Assert.assertThat(path, IsNull.notNullValue());          
        }
        
        
        Assert.assertThat( p[0].getParent(), IsEqual.equalTo(p[1]));
        Assert.assertThat( p[0].getRoot(), IsNull.nullValue());
        Assert.assertThat( p[1].getParent(), IsEqual.equalTo(p[2]));
        Assert.assertThat( p[3].getRoot(), IsEqual.equalTo(p[4]));
    } 
    
    @Test 
    public void resolve() {
        
        Path p[] = {
            Paths.get("lib-cl/cyclic/"),
            Paths.get("lib-cl/cyclic/package.json")
        };

        for( Path path : p) {
            Assert.assertThat(path, IsNull.notNullValue());          
        }
        
        
        Assert.assertThat( p[0].resolve("package.json"), IsEqual.equalTo(p[1]));
    } 
    
    @Test
    public void classpath() {

        final Path p = Paths.get("classpath://scripting/jvm-rhino-cl-npm.js");
        
        
        Assert.assertThat(p.startsWith("classpath:"), Is.is(true));  

        Assert.assertThat(p.subpath(1,p.getNameCount()).toString(), IsEqual.equalTo("scripting/jvm-rhino-cl-npm.js"));          
        
    }
}
