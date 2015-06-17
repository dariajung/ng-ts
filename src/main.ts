/// <reference path='../typings/node/node.d.ts' />
/// <reference path='../typings/typescript/typescript.d.ts' />

import ts = require('typescript');
import compiler = require('./test');

export const COMPILER_OPTIONS: ts.CompilerOptions = {
	allowNonTsExtensions: true,
	module: ts.ModuleKind.CommonJS,
	target: ts.ScriptTarget.ES5,
};

compiler.compile(['../test/hello.ts'], COMPILER_OPTIONS);