///<reference path="../typings/node/node.d.ts"/>
///<reference path="../typings/typescript.d.ts"/>
var ts = require('typescript');
var fs = require('fs'); // filesystem module
//import process = require('process');
exports.COMPILER_OPTIONS = {
    allowNonTsExtensions: true,
    module: 1 /* CommonJS */,
    target: 1 /* ES5 */,
};
/* TranspilerOptions Class will go here */
/* The Transpiler Class */
var Transpiler = (function () {
    //private transpilers;
    function Transpiler() {
        // last comment index?
        this.errors = [];
    }
    // (Transpiler options here when I know what's needed) 
    // will instantiate different transpilers; nothing here yet
    /* Create a Transpiler Class */
    Transpiler.prototype.createCompilerHost = function (fileNames, options) {
        console.log("create compiler host");
        console.log(fileNames);
        // why is this needed? rather, what is the point?
        var fileMap = {};
        fileNames.forEach(function (f) { return fileMap[f] = true; }); // why?
        // sanity check that given files actually exist
        fileNames.forEach(function (fpath) {
            fs.exists(fpath, function (exists) {
                console.log(fpath + ": ");
                console.log(exists ? "exists" : "nope :(");
            });
        });
        // methods for the Compiler Host
        return {
            getSourceFile: function (sourceName, languageVersion) {
                console.log('does this occur');
                if (fileMap.hasOwnProperty(sourceName)) {
                    var contents = fs.readFileSync(sourceName, 'UTF-8');
                    console.log(contents);
                    return ts.createSourceFile(sourceName, contents, exports.COMPILER_OPTIONS.target, "0");
                }
                if (filename === "lib.d.ts")
                    return ts.createSourceFile(filename, '', compilerOptions.target, "0");
                return undefined;
            },
            writeFile: function (name, text, writeByteOrderMark) {
                fs.writeFile(name, text);
            },
            getDefaultLibFilename: function () {
                return "lib.d.ts";
            },
            useCaseSensitiveFileNames: function () {
                return true;
            },
            getCanonicalFileName: function (filename) {
                return filename;
            },
            getCurrentDirectory: function () {
                return "";
            },
            getNewLine: function () {
                return "\n";
            }
        };
    };
    return Transpiler;
})();
exports.Transpiler = Transpiler;
var host = new Transpiler();
host.createCompilerHost(['test/hello.ts']);

//# sourceMappingURL=main.js.map