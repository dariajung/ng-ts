///<reference path="../typings/node/node.d.ts"/>
///<reference path="../typings/typescript.d.ts"/>

import ts = require('typescript');
import fs = require('fs'); // filesystem module
import util = require('util');
import path = require('path');
//import process = require('process');

export const COMPILER_OPTIONS: ts.CompilerOptions = {
	allowNonTsExtensions: true,
	module: ts.ModuleKind.CommonJS,
	target: ts.ScriptTarget.ES5,
};

/* TranspilerOptions Class will go here */


/* The Transpiler Class */
export class Transpiler {
	private output: string; // for now, what is an output object?
	private currentFile: ts.SourceFile;

	// last comment index?
	private errors: string[] = [];

	//private transpilers;

	constructor() {

	} 

	// (Transpiler options here when I know what's needed) 
	
	// will instantiate different transpilers; nothing here yet

	/* Create a Transpiler Class */
	createCompilerHost(fileNames: string[], options?: ts.CompilerOptions) {
		console.log("create compiler host");
		console.log(fileNames);

		// why is this needed? rather, what is the point?
		var fileMap: { [s: string]: boolean } = {};
		fileNames.forEach((f) => fileMap[f] = true); // why?

		// sanity check that given files actually exist
		fileNames.forEach((fpath) => {
			fs.exists(fpath, function(exists) {
				console.log(fpath + ": ")
				console.log(exists ? "exists" : "nope :(");
			});
		});

		// methods for the Compiler Host
		return {
			getSourceFile: (sourceName, languageVersion) => {
				console.log('does this occur');
				if (fileMap.hasOwnProperty(sourceName)) {
					var contents = fs.readFileSync(sourceName, 'UTF-8');
					console.log(contents);
					return ts.createSourceFile(sourceName, contents, COMPILER_OPTIONS.target, "0");
				} 
				if (filename === "lib.d.ts")
					return ts.createSourceFile(filename, '', compilerOptions.target, "0");
				return undefined;
			},
			writeFile: function(name, text, writeByteOrderMark) {
				fs.writeFile(name, text);
			},
			getDefaultLibFilename: function() { return "lib.d.ts"; },
			useCaseSensitiveFileNames: function() { return true; },
			getCanonicalFileName: function(filename) { return filename; },
			getCurrentDirectory: function() { return ""; },
			getNewLine: function() { return "\n"; }
		};
	}
}

var host = new Transpiler();
host.createCompilerHost(['test/hello.ts']);
