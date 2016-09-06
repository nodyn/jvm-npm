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

/**
 *
 * @author softphone
 */
public class Console {
    
     public static boolean DEBUG = false;
     
     public static void log( String msg, Object... args ) {
        if( !DEBUG) return;
        
        System.out.printf( msg, (Object[])args);
        System.out.println();
    }

     public static void err( String msg, Object... args ) {
        
        System.err.printf( msg, (Object[])args);
        System.err.println();
        
        int lastIndex = args.length - 1;
        
        if( lastIndex>=0 && args[lastIndex] instanceof Throwable ) {
            ((Throwable)args[lastIndex]).printStackTrace(System.err);
        }
    }

}
