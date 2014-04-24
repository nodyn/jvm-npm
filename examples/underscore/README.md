# Example: underscore.js

To run the example, you should have either dynjs or jrunscript
(Nashorn) in your PATH. And you need to install the underscore NPM
module. First do that.

    $ npm install

This will look at `package.json`, determine the app dependencies and
download them for you in `./node_modules`. Next choose your runtime,
and run the app.

    $ dynjs app.js

Or 

    $ nashorn app.js

Either should work.
