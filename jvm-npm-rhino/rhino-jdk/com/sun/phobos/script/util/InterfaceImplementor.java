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

package com.sun.phobos.script.util;

import javax.script.*;
import java.lang.reflect.*;

/*
 * java.lang.reflect.Proxy based interface implementor. This is meant
 * to be used to implement Invocable.getInterface.
 *
 * @version 1.0
 * @author Mike Grogan
 * @since 1.6
 */
public class InterfaceImplementor {
    
    private Invocable engine;
    
    /** Creates a new instance of Invocable */
    public InterfaceImplementor(Invocable engine) {
        this.engine = engine;
    }
    
    public class InterfaceImplementorInvocationHandler implements InvocationHandler {
        private Invocable engine;
        private Object thiz;
        public InterfaceImplementorInvocationHandler(Invocable engine, Object thiz) {
            
            this.engine = engine;
            this.thiz = thiz;
        }
        
        public Object invoke(Object proxy , Method method, Object[] args)
        throws java.lang.Throwable {
            // give chance to convert input args
            args = convertArguments(method, args);
            Object result = engine.invokeMethod(thiz, method.getName(), args);
            // give chance to convert the method result
            return convertResult(method, result);
        }
    }
    
    public <T> T getInterface(Object thiz, Class<T> iface)
    throws ScriptException {
        if (iface == null || !iface.isInterface()) {
            throw new IllegalArgumentException("interface Class expected");
        }
        return iface.cast(Proxy.newProxyInstance(iface.getClassLoader(),
                new Class[]{iface},
                new InterfaceImplementorInvocationHandler(engine, thiz)));
    }

    // called to convert method result after invoke
    protected Object convertResult(Method method, Object res) 
                                   throws ScriptException {
        // default is identity conversion
        return res;
    }

    // called to convert method arguments before invoke
    protected Object[] convertArguments(Method method, Object[] args)
                                      throws ScriptException {
        // default is identity conversion
        return args;
    }
}
