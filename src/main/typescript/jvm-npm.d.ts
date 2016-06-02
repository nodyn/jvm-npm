/**
 *
 * JVM-NPM TYPESCRIPT DEFINITION
 *
 */
declare namespace java {
    namespace lang {
        var System: any;
        var Thread: any;
        var Exception: any;
        var Thread: any;
    }
    namespace io {
        var File: any;
    }
    namespace nio {
        namespace file {
            interface Path {
                toString(): string;
                normalize(): Path;
                resolve(p: string): Path;
                getParent(): Path;
                startsWith(p: Path): boolean;
            }
            var Paths: any;
            var Path: any;
        }
    }
    namespace util {
        var Scanner: any;
    }
}
interface FunctionConstructor {
    new (args: string[], body: string): Function;
}
interface String {
    endsWith(suffix: string): boolean;
}

interface ResolveResult {
  path:string;
  core?:boolean;
}

declare function print(...args: Object[]): any;
declare var module: any;
declare var require: Function;
declare var NativeRequire: any;
declare var Require: any;

type Path = java.nio.file.Path;
