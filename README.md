# jvm-npm

<a href="http://search.maven.org/#search%7Cga%7C1%7Ca%3A%22jvm-npm-core%22">

Support for NPM module loading in Javascript runtimes on the JVM.

Implementation is based on [http://nodejs.org/api/modules.html] and should be fully compatible. This, of course, does not include the
full **node.js** API, so don't expect all of the standard NPM modules that depend on it to work. 

If you are writing your own NPM modules in [DynJS](http://dynjs.org/), [Rhino](https://github.com/mozilla/rhino) or [Nashorn](http://www.oracle.com/technetwork/articles/java/jf14-nashorn-2126515.html), this should work just fine.

DynJS implementaion is currently considered **legacy**, Is suggested to use it with **Rhino** and/or **Nashorn**

## Usage

### Nashorn

To enable **JVM-NPM** for Nashorn in your project  add dependency below

```xml
    <dependency>
        <groupId>org.bsc</groupId>
        <artifactId>jvm-npm-core</artifactId>
        <version>${jvmnpm.version}</version>
    </dependency>
```

and in your code load module

```xml

    final ScriptEngineManager manager = new ScriptEngineManager();
	
	final ScriptEngine service = manager.getEngineByName("nashorn");
	
	service.eval( "load('classpath:jvm-cl-npm.js');");
```

### Rhino

To enable **JVM-NPM** for Rhino in your project  add dependencies below

```xml

    <dependency>
        <groupId>org.bsc</groupId>
        <artifactId>jvm-npm-core</artifactId>
        <version>${jvmnpm.version}</version>
    </dependency>
    
    <dependency>
        <groupId>org.bsc</groupId>
        <artifactId>jvm-npm-rhino</artifactId>
        <version>${jvmnpm.version}</version>
    </dependency>
    
```

and in your code load module

```xml

    final ScriptEngineManager manager = new ScriptEngineManager();
	
	final ScriptEngine service = manager.getEngineByName("rhino-npm");
	
	service.eval( "load('classpath:jvm-cl-npm.js');");
```
    
#### JDK7

If you need run on JRE7 then include deps
  
```xml

    <dependency>
        <groupId>org.bsc</groupId>
        <artifactId>jvm-npm-core</artifactId>
        <version>${jvmnpm.version}</version>
    </dependency>
    
    <dependency>
        <groupId>org.bsc</groupId>
        <artifactId>jvm-npm-rhino</artifactId>
        <version>${jvmnpm.version}</version>
        <classifier>jdk7</classifier>
    </dependency>
    
```


### Debug

set system property `jvm-npm.debug` at `true`
