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

import java.util.*;

/**
 * Entry set implementation for Bindings implementations
 *
 * @version 1.0
 * @author Mike Grogan
 * @since 1.6
 */
public class BindingsEntrySet extends AbstractSet<Map.Entry<String, Object>> {
    
    private BindingsBase base;
    private String[] keys;
    
    public BindingsEntrySet(BindingsBase base) {
        this.base = base;
        keys = base.getNames();
    }
    
    public int size() {
        return keys.length;
    }
    
    public Iterator<Map.Entry<String, Object>> iterator() {
        return new BindingsIterator();
    }
    
    public class BindingsEntry implements Map.Entry<String, Object> {
        private String key;
        public BindingsEntry(String key) {
            this.key = key;
        }
        
        public Object setValue(Object value) {
            throw new UnsupportedOperationException();
        }
        
        public String getKey() {
            return key;
        }
        
        public Object getValue() {
            return base.get(key);
        }
        
    }
    
    public class BindingsIterator implements Iterator<Map.Entry<String, Object>> {
        
        private int current = 0;
        private boolean stale = false;
        
        public boolean hasNext() {
            return (current < keys.length);
        }
       
        public BindingsEntry next() {
            stale = false;
            return new BindingsEntry(keys[current++]);
        }
        
        public void remove() {
            if (stale || current == 0) {
                throw new IllegalStateException();
            }
            
            stale = true;
            base.remove(keys[current - 1]);
        }
        
    }
    
}
