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

import static org.javascript.rhino.Console.log;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.commonjs.module.provider.ModuleSource;
import org.mozilla.javascript.commonjs.module.provider.ModuleSourceProviderBase;

/**
 *
 * @author softphone
 */
@SuppressWarnings("serial")
public class RhinoModuleSourceClassLoaderProvider extends ModuleSourceProviderBase {

    private long getLength(final Scriptable paths) {
        final long llength = ScriptRuntime.toUint32(
                ScriptableObject.getProperty(paths, "length"));
        return llength;
    }
    
    private boolean hasValidExt( String moduleId ) {
        return ( moduleId.endsWith(".json") ||
            moduleId.endsWith(".js")) ;
    }
    
    private String normalizeModuleIdName( String moduleId ) {
        if( moduleId.startsWith("./") ) moduleId = moduleId.substring(2);
        
        if( hasValidExt(moduleId) )  return moduleId;
                
        return moduleId.concat(".js");
    }

    private URI normalizeURI( URI uri ) throws URISyntaxException {
        
        final String n = normalizeModuleIdName(uri.toString());
        
        return new URI(n);
    }

    @Override
    public ModuleSource loadSource(String moduleId, Scriptable paths, Object validator) throws IOException, URISyntaxException {
        log( "\nloadSource( %s, %d, %s )\n", moduleId, getLength(paths), validator );
        return super.loadSource(moduleId, paths, validator); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public ModuleSource loadSource(URI uri, URI base, Object validator) throws IOException, URISyntaxException {
        log( "\nloadSource( %s, %s, %s )\n", uri, base, validator );
        return super.loadSource(uri, base, validator); //To change body of generated methods, choose Tools | Templates.
    }
    
    @Override
    protected ModuleSource loadFromFallbackLocations(String moduleId, Object validator) throws IOException, URISyntaxException {     
        log( "\nloadFromFallbackLocations( %s, %s )\n", moduleId, validator );
     
        final ClassLoader cl = Thread.currentThread().getContextClassLoader();
        
        final String _name = normalizeModuleIdName(moduleId);
        final java.net.URL moduleURL = cl.getResource(_name);
        
        if( moduleURL != null ) {

            return loadFromUri(moduleURL.toURI(), null, validator);
            
        }

        return null;
    }

    @Override
    protected ModuleSource loadFromUri(URI uri, URI base, Object validator) throws IOException, URISyntaxException {
        log( "loadFromUri( %s, %s, %s )", uri, base, validator );

        final URI _uri = normalizeURI(uri);
        final java.io.Reader reader = new java.io.InputStreamReader(_uri.toURL().openStream());
        final Object securityDomain = null;
        return new ModuleSource( 
                reader,
                securityDomain, 
                uri, 
                base,
                validator );
                
    }


    
}
