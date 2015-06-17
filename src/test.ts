///<reference path="../typings/node/node.d.ts"/>
///<reference path="../typings/typescript/typescript.d.ts"/>

import ts = require('typescript');

// returns void
export function compile(fileNames: string[], options: ts.CompilerOptions): void {

	var program = ts.createProgram(fileNames, options);
	var emitResult = program.emit();

	// diagnostics?
	var allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

	allDiagnostics.forEach(diagnostic => {
		var { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
		var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
		console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
	});

	// what is the exitCode?
	var exitCode = emitResult.emitSkipped ? 1 : 0;
    console.log(`Process exiting with code '${exitCode}'.`);
    process.exit(exitCode);

    compile(process.argv.slice(2), {
		noEmitOnError: true, noImplicitAny: true,
		target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
	});

}