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

import javax.script.ScriptException;

/**
 * An extension of javax.script.ScriptException that allows
 * the cause of an exception to be set.
 */
public class ExtendedScriptException extends ScriptException {
    
    private Throwable cause;
    
    public ExtendedScriptException(
            Throwable cause,
            String message,
            String fileName,
            int lineNumber,
            int columnNumber) {
        super(message, fileName, lineNumber, columnNumber);
        this.cause = cause;
    }

    public ExtendedScriptException(String s) {
        super(s);
    }
    
    public ExtendedScriptException(Exception e) {
        super(e);
    }
    
    public ExtendedScriptException(String message, String fileName, int lineNumber) {
        super(message, fileName, lineNumber);
    }
    
    public ExtendedScriptException(Throwable cause, String message, String fileName, int lineNumber) {
        super(message, fileName, lineNumber);
        this.cause = cause;
    }

    public ExtendedScriptException(String message,
            String fileName,
            int lineNumber,
            int columnNumber) {
        super(message, fileName, lineNumber, columnNumber);
    }
    
    public Throwable getCause() {
        return cause;
    }
}
