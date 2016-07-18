/*
 * Copyright (C) 2006 Sun Microsystems, Inc. All rights reserved. 
 * Use is subject to license terms.
 *
 * Redistribution and use in source and binary forms, with or without modification, are 
 * permitted provided that the following conditions are met: Redistributions of source code 
 * must retain the above copyright notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list of 
 * conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution. Neither the name of the Sun Microsystems nor the names of 
 * is contributors may be used to endorse or promote products derived from this software 
 * without specific prior written permission. 

 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
 * OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY 
 * AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER 
 * OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR 
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON 
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
 * OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
package org.javascript.rhino;

import java.util.Arrays;
import java.util.List;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineFactory;

import org.kohsuke.MetaInfServices;

@MetaInfServices(ScriptEngineFactory.class)
public class JSR223RhinoScriptEngineFactory implements ScriptEngineFactory {

    private static final String RHINO_VERSION = "1.7.7.1";

    private static final java.util.Properties defaults = new java.util.Properties();

    static {
        defaults.setProperty(ScriptEngine.NAME, "javascript");
        defaults.setProperty(ScriptEngine.ENGINE, "Mozilla Rhino");
        defaults.setProperty(ScriptEngine.ENGINE_VERSION, RHINO_VERSION);
        defaults.setProperty(ScriptEngine.LANGUAGE, "ECMAScript");
        defaults.setProperty(ScriptEngine.LANGUAGE_VERSION, "1.8");
        defaults.setProperty("THREADING", "MULTITHREADED");
    }

    private final java.util.Properties parameters;

    public JSR223RhinoScriptEngineFactory() {
        parameters = new java.util.Properties(defaults);
    }

    protected void setParameter(String key, String value) {
        parameters.setProperty(key, value);
    }

    public String getName() {
        return (String) getParameter(ScriptEngine.NAME);
    }

    public String getEngineName() {
        return (String) getParameter(ScriptEngine.ENGINE);
    }

    public String getEngineVersion() {
        return (String) getParameter(ScriptEngine.ENGINE_VERSION);
    }

    public String getLanguageName() {
        return (String) getParameter(ScriptEngine.LANGUAGE);
    }

    public String getLanguageVersion() {
        return (String) getParameter(ScriptEngine.LANGUAGE_VERSION);
    }

    @Override
    public List<String> getExtensions() {
        return Arrays.asList("js");
    }

    @Override
    public List<String> getMimeTypes() {
        return Arrays.asList(
                "application/javascript",
                "application/ecmascript",
                "text/javascript",
                "text/ecmascript");
    }

    @Override
    public Object getParameter(String key) {
        return parameters.getProperty(key);
    }

    @Override
    public String getMethodCallSyntax(String obj, String method, String... args) {
        throw new UnsupportedOperationException("getMethodCallSyntax(String,String,String...)");
    }

    @Override
    public String getOutputStatement(String toDisplay) {
        throw new UnsupportedOperationException("getOutputStatement(String)");
    }

    @Override
    public String getProgram(String... statements) {
        throw new UnsupportedOperationException("getProgram(String...)");
    }

    @Override
    public List<String> getNames() {
        return Arrays.asList("rhino-npm");
    }

    @Override
    public ScriptEngine getScriptEngine() {

        final ClassLoader cl = getClass().getClassLoader();
        final JSR223RhinoScriptEngine service = new JSR223RhinoScriptEngine(cl, (cx, engine) -> {

            final boolean sealed = false;
            
            return new JSR223RhinoTopLevel(cx, sealed, engine);
        });

        return service;

    }

}
