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
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.mozilla.javascript.commonjs.module.provider.ModuleSource;
import org.mozilla.javascript.commonjs.module.provider.ModuleSourceProviderBase;
import static org.jasmine.Console.*;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

/**
 *
 * @author softphone
 */
public class RhinoModuleSourceProvider extends ModuleSourceProviderBase {

    private long getLength(final Scriptable paths) {
        final long llength = ScriptRuntime.toUint32(
                ScriptableObject.getProperty(paths, "length"));
        return llength;
    }
    
    private String normalizeModuleIdName( String moduleId ) {
        
        return moduleId.endsWith(".js") ? moduleId : moduleId.concat(".js");
    }
    
    @Override
    public ModuleSource loadSource(URI uri, URI base, Object validator) throws IOException, URISyntaxException {
        log( "loadSource( %s, %s, %s )", uri, base, validator );
        return super.loadSource(uri, base, validator); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public ModuleSource loadSource(String moduleId, Scriptable paths, Object validator) throws IOException, URISyntaxException {
        log( "loadSource( %s, %d, %s )", moduleId, getLength(paths), validator );
        return super.loadSource(moduleId, paths, validator); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    protected ModuleSource loadFromFallbackLocations(String moduleId, Object validator) throws IOException, URISyntaxException {
        
        final String _moduleId = normalizeModuleIdName(moduleId);
        
        log( "loadFromFallbackLocations( %s, %s )", _moduleId, validator );

        final Path basedir = Paths.get(System.getProperty("user.dir"));

        final Path path = Paths.get(basedir.toString(), _moduleId);

        log( "\t\t lookup for file [%s]", path.toString() );
        if( path.toFile().exists() ) {

            log( "\t\t found file [%s]", path.toString() );
            
            return loadSource(path.toUri(), null, validator);
        }     
        
        final ClassLoader cl = Thread.currentThread().getContextClassLoader();
        
        java.net.URL moduleURL = cl.getResource(_moduleId);
        
        log( "\t\t look up in classpath [%s]", _moduleId );
        if( moduleURL != null ) {

            log( "\t\t found in classpath [%s]", _moduleId );

            return loadSource(moduleURL.toURI(), null, validator);
            
        }
        
        log( "\t\tmodule not found  [%s]", _moduleId );

        return null;
    }

    @Override
    protected ModuleSource loadFromUri(URI uri, URI base, Object validator) throws IOException, URISyntaxException {
                log( "loadFromUri( %s, %s, %s )", uri, base, validator );
                
                final java.io.Reader reader = new java.io.InputStreamReader(uri.toURL().openStream());
                final Object securityDomain = null;
                return new ModuleSource( 
                        reader,
                        securityDomain, 
                        uri, 
                        base,
                        validator );
                
    }


    
}
