///<reference path="../typings/node/node.d.ts"/>
///<reference path="../typings/typescript/typescript.d.ts"/>

import * as ts from 'typescript';
import * as main from './main';

export class TranspilerBase {

	constructor(private transpiler: main.Transpiler) {}

	visit(node: ts.Node) { this.transpiler.visit(node); }
	emit(str: string) { this.transpiler.emit(str); }
	emitNoSpace(str: string) { this.transpiler.emitNoSpace(str); }
	/* Report error vs. checkForErrors? */

	/* What is the difference between visit vs. visitNode? */
	
	
}