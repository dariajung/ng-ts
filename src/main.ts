///<reference path="../typings/node/node.d.ts"/>
///<reference path="../typings/typescript/typescript.d.ts"/>

import ts = require('typescript');
import fs = require('fs'); // filesystem module
import util = require('util');
import path = require('path');

var HashMap = require('hashmap');

/* TranspilerOptions Class will go here */

/* The Transpiler Class */
export class Transpiler {
	private output: string; // for now, what is an output object?
	private currentFile: ts.SourceFile;

	map = new HashMap();
	nodes: ts.Node[] = [];

	// last comment index?
	private errors: string[] = [];

	//private transpilers;
	// (Transpiler options here when I know what's needed) 

	constructor() {
		// will instantiate different transpilers; nothing here yet

	} 

	compile(fileNames: string[], options: ts.CompilerOptions): void {
	    var program = ts.createProgram(fileNames, options);
	    var emitResult = program.emit();

	    var allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

	    allDiagnostics.forEach(diagnostic => {
	        var loc = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
	        var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
	        console.log(
	        	'${diagnostic.file.fileName} (${loc.line + 1},${loc.character + 1}): ${message}'
	        );
	    });

	    var exitCode = emitResult.emitSkipped ? 1 : 0;
	    console.log("Process exiting with code '${exitCode}'.");
	    process.exit(exitCode);
	}

	callCompile() {
		this.compile(process.argv.slice(2), {
			noEmitOnError: true, noImplicitAny: true,
			target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
		});
	}

	// return set options for the compiler
	getCompilerOptions(): ts.CompilerOptions {
		const options: ts.CompilerOptions = {
			allowNonTsExtensions: true,
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES6,
		};
		return options;
	}

	/* Create a Transpiler Class */
	createCompilerHost(fileNames: string[], options?: ts.CompilerOptions): ts.CompilerHost {
		// why is this needed? rather, what is the point?
		var fileMap: { [s: string]: boolean } = {};
		fileNames.forEach((f) => fileMap[f] = true); // why?

		// sanity check that given files actually exist
		// fileNames.forEach((fpath) => {
		// 	fs.exists(fpath, function(exists) {
		// 		console.log(exists ? "exists" : "nope :(");
		// 	});
		// });

		//console.log(process.cwd());

		// the methods of a compiler host object
		return {
			getSourceFile: (sourceName, languageVersion) => {
				if (fileMap.hasOwnProperty(sourceName)) {
					console.log('hello?');
					console.log(sourceName);
					var contents = fs.readFileSync(sourceName, 'UTF-8');
					console.log("==========================================================");
					console.log(contents);
					console.log("==========================================================");
					return ts.createSourceFile(sourceName, contents, 
							this.getCompilerOptions().target, true);
				} 
				if (sourceName === "lib.d.ts")
					return ts.createSourceFile(sourceName, '', this.getCompilerOptions().target, true);
				return undefined;
			},
			// these are not used; just exist to satisfy interface?
			writeFile: function(name, text, writeByteOrderMark, outputs) {
				fs.writeFile(name, text);
			},
			getDefaultLibFileName: function() { return "lib.d.ts"; },
			useCaseSensitiveFileNames: function() { return true; },
			getCanonicalFileName: function(filename) { return filename; },
			getCurrentDirectory: function() { return ""; },
			getNewLine: function() { return "\n"; }
		};
	}

	/* For later? Do I even need this though. */
	prettyPrint() {
	}

	/* Walk the AST of the program */
	walk(sourcefile: ts.SourceFile, program: ts.Program) {
		var typeChecker = program.getTypeChecker();

		//console.log(typeChecker.getTypeAtLocation(sourcefile));

		traverse(sourcefile, typeChecker);

		function traverse(node: ts.Node, typeChecker, count?: number) {

			switch (node.kind) {
				case ts.SyntaxKind.PropertyAssignment:
					console.log('PropertyAssignment');
					break;
				case ts.SyntaxKind.PropertyDeclaration:
					console.log('PropertyDeclaration');
					break;
				case ts.SyntaxKind.ShorthandPropertyAssignment:
					console.log('ShorthandPropertyAssignment');
					break;
				case ts.SyntaxKind.BinaryExpression:
					//console.log('BinaryExpression');
					var binExpr = <ts.BinaryExpression>node;
					//console.log(binExpr);
					break;
				case ts.SyntaxKind.Identifier:
					var ident = <ts.Identifier>node;
					//console.log(typeChecker.getTypeAtLocation(ident));
					break;
				case ts.SyntaxKind.DotToken:
					console.log("dot token, do nothing");
					break;
				// PAE has: 
				// 1. expression: LeftHandSideExpression
				// 2. dotToken: Node
				// 3. name: Identifier (right hand side of expression)
				case ts.SyntaxKind.PropertyAccessExpression:
					var pae = <ts.PropertyAccessExpression>node; // is this casting?
					console.log('PropertyAccessExpression');
					console.log("========================================================");
					console.log(pae);

					//console.log(pae.expression + ": " + typeChecker.typeToString(
					//	typeChecker.getTypeAtLocation(pae.expression)));
					//console.log(pae.name + ": " + typeChecker.typeToString(
					//	typeChecker.getTypeAtLocation(pae.name)));

					//console.log(pae.expression.text); // doesn't have it but it prints? I don't get it.


					// this.map.set(pae.expression.text, { });
					
					console.log("========================================================");
					break;
			}
			ts.forEachChild(node, function(node) {
				traverse(node, typeChecker, count);
			});
		}

		/* Report information when necessary */
		function report(node: ts.Node, message: string) {
			var lc = sourcefile.getLineAndCharacterOfPosition(node.getStart());
        	console.log('${sourcefile.fileName} (${lc.line + 1},${lc.character + 1}): ${message}');
		}
	}
}

var transpiler = new Transpiler();
var host = transpiler.createCompilerHost(['../../test/hello.ts']);
console.log('created compiler host');
var source : ts.SourceFile = host.getSourceFile('../../test/hello.ts', ts.ScriptTarget.ES6);

// to create the program, the host calls getSourceFile IF you pass in a host. It's an optional parameter
var program : ts.Program = ts.createProgram(['../../test/hello.ts'], transpiler.getCompilerOptions());
transpiler.walk(source, program);
