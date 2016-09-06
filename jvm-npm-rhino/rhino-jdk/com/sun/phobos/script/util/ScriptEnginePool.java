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
import java.util.LinkedList;

/**
 * Simple pool of script engines with configurable size and ScriptEngine type.
 * Used by HttpScriptServlets to prevent concurrent executions of scripts on 
 * multiple threads.
 */

public class ScriptEnginePool {
    
    private static final int DEFAULT_CAPACITY = 10;
    private int capacity;
    private int size;
    private LinkedList pool;
    private ScriptEngineFactory fact;
    private boolean multiThreaded;
    
    public ScriptEnginePool(ScriptEngineFactory fact, int capacity) {
        
        pool = new LinkedList();
        this.capacity = capacity;
        this.fact = fact;
        this.size = 0;
        String value = (String)fact.getParameter("THREADING");
        if (value.equals("THREAD-ISOLATED") || value.equals("STATELESS")) {
            multiThreaded = true;
            //just use a single engine
            capacity = 1;
        } else {
            multiThreaded = false;
        }
    }

    public ScriptEnginePool(ScriptEngineFactory fact) {
        this(fact, DEFAULT_CAPACITY);
    }
    
    public ScriptEnginePool(ScriptEngineFactory fact, ScriptEngine eng) {
        this(fact);
        synchronized(this) {
            pool.addLast(eng);
        }
    }
    
    public synchronized ScriptEngine checkOut() {
        
        if (pool.size() > 0) {
            //there engines in pool awaiting reuse
            if (multiThreaded) {
                //always return first (only) engine.. do not remove
                return (ScriptEngine)pool.getFirst();
            } else {
                return (ScriptEngine)pool.removeFirst();
            }
        } else if (size < capacity) {
            //create a new engine
            size++;
            ScriptEngine ret = fact.getScriptEngine();
            if (multiThreaded) {
                //size and capacity are now both 1.  Add the engine to
                //the pool for everyone to use. 
                pool.add(ret);
            }
            return ret;
        } else {
            //won't get here in multiThreaded case
            while (pool.size() == 0) {
                try {
                    wait();
                } catch (InterruptedException e) {
                }
            }
            return (ScriptEngine)pool.removeFirst();
        }
    }
    
    public synchronized void checkIn(ScriptEngine eng) {
        
        if (multiThreaded) {
            //pool always contatins exactly one engine
            return;
        }
        
        pool.addLast(eng);
        notify();
    }
}
        
    
    
