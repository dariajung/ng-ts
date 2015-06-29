///<reference path="../typings/node/node.d.ts"/>
///<reference path="../typings/typescript/typescript.d.ts"/>

import ts = require('typescript');
var fs = require('fs'); // filesystem module
var util = require('util');
var path = require('path');
var Map = require('es6-map');

/* TranspilerOptions Class will go here */

/* The Transpiler Class */
export class Transpiler {
  private output: string; // for now, what is an output object?
  private currentFile: ts.SourceFile;

  /* initialize to '' */
  prevRename: string = '';

  renameMap = new Map();
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

  /* NoEmitOnError is a bit silly given the current situation */
  callCompile() {
    this.compile(process.argv.slice(2), {
      noEmitOnError: true, noImplicitAny: true,
      target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS
    });
  }

  /* return set options for the compiler */
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
    fileNames.forEach((fpath) => {
     fs.exists(fpath, function(exists) {
         console.log(exists ? "exists" : "nope :(");
     });
    });

    /* the methods of a compiler host object */
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

  /* Walk the AST of the program */
  walk(sourcefile: ts.SourceFile, program: ts.Program) {
    var typeChecker = program.getTypeChecker();

    traverse(sourcefile, typeChecker, this.renameMap, 0, '');

    function traverse(node: ts.Node, typeChecker, renameMap, count?: number, parentString?: string) {
      console.log(node.kind);
      console.log('pstring: ' + parentString);
      switch (node.kind) {
        case ts.SyntaxKind.ClassDeclaration:
          console.log("========================================================");
          console.log('ClassDeclaration');
          var classDeclaration = <ts.ClassDeclaration>node;
          //console.log(classDeclaration);
          console.log("========================================================");
          parentString = updateParentString(parentString, classDeclaration.name.text);
          break;
        case ts.SyntaxKind.PropertyAssignment:
          console.log('PropertyAssignment');
          break;
        case ts.SyntaxKind.PropertyDeclaration:
          console.log('PropertyDeclaration');
          var pd = <ts.PropertyDeclaration>node;
          //console.log(pd);

          //console.log(pd.parent.name.text + '.' + pd.name.text);
          parentString = updateParentString(parentString, pd.name.text);

          // try {
          //   console.log("TYPECHECKER");
          //   console.log(typeChecker.typeToString(typeChecker.getTypeAtLocation(pd)));
          // } catch(error) {
          //   console.log("TYPECHECKER ERROR " + error.stack);
          // }
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
          // console.log("========================================================");
          // console.log('Identifier');
          // var ident = <ts.Identifier>node;
          // console.log(ident);
          // console.log("========================================================");
          //console.log(typeChecker.getTypeAtLocation(ident));
          break;
        case ts.SyntaxKind.DotToken:
          //console.log("dot token, do nothing");
          break;
        // PAE has: 
        // 1. expression: LeftHandSideExpression
        // 2. dotToken: Node
        // 3. name: Identifier (right hand side of expression)
        case ts.SyntaxKind.PropertyAccessExpression:
          var pae = <ts.PropertyAccessExpression>node; // is this casting?

          console.log('PropertyAccessExpression');
          console.log("========================================================");
          
          /* If _.expression.text exists, then it is top level, everything under it 
            is a "right hand side" expression  */
          /* DFS here? */
          // if (pae.expression.text) {
          //   console.log(pae);
          //   parentString = updateParentString(parentString, pae.expression.text);
          //   console.log(pae.expression.text);
          //   try {
          //     console.log("TYPECHECKER");
          //     console.log(typeChecker.typeToString(typeChecker.getTypeAtLocation(pae)));
          //   } catch(error) {
          //     console.log("TYPECHECKER ERROR " + error.stack);
          //   }
          // }

          // pae.name is the right hand side expression
          if (childrenExist(pae.expression) && pae.name.text) {
            console.log(pae);

            // need to traverse all of LHS first
            parentString = updateParentString(parentString, pae.name.text);
            console.log(pae.name.text);
          }
          
          console.log("========================================================");
          break;
      }

      ts.forEachChild(node, function(node) {
        console.log(parentString);
        traverse(node, typeChecker, renameMap, count, parentString);
      });
    }

    this.renameMap.forEach(function(value, key, map) {
      console.log("Key: %s, Value: %s", key, value);
    });

    /* Report information when necessary */
    function report(node: ts.Node, message: string) {
      var lc = sourcefile.getLineAndCharacterOfPosition(node.getStart());
      console.log('${sourcefile.fileName} (${lc.line + 1},${lc.character + 1}): ${message}');
    }

    function updateParentString(p: string, c: string): string {
      if (p.length === 0) {
        return c;
      } else {
        return p + '$' + c;
      }
    }

    /* Need a smarter way to do this */
    function childrenExist(topNode) {
      var count = 0;
      ts.forEachChild(topNode, function(node) {
        if (node) count++;
      });

      console.log(count);

      return (count > 0);
    }
  }

  // not sure where this should go, transpiler doesn't really make senes?
  nextChar(c: string): string {
    return String.fromCharCode(c.charCodeAt(0) + 1);
  }

  /* Returns a string for the new property name */
  /* 0 -> a, 1 -> b, ... 25 -> z, 26 -> aa , ...*/
  generateNextLateralPropertyName(code: string): string {
    var chars = code.split('');
    console.log(chars);
    var len: number = code.length;
    var last: string = chars[len - 1];

    /* Grab the next letter using nextChar */
    for (var i = len - 1; i >= 0; i--) {
      if (chars[i] !== 'z') {
        chars[i] = this.nextChar(chars[i]);
        break;
      } else {
        chars[i] = 'a';
        if (i === 0) {
          return 'a' + (chars.join(''));             
        }
      }
    }
    return chars.join('');
  }  

  /* Given a key, assign a generated property shortname */
  assignNewPropertyName(key: string): void {
    if (this.renameMap.has(key)) {
      return;
    } else {
      var newPropName = this.generateNextLateralPropertyName(this.prevRename);
      this.renameMap.set(key, newPropName);
    }
  }
}

var transpiler = new Transpiler();
var host = transpiler.createCompilerHost(['../../test/hello.ts']);
//console.log('created compiler host');
var source : ts.SourceFile = host.getSourceFile('../../test/hello.ts', ts.ScriptTarget.ES6);

// to create the program, the host calls getSourceFile 
// IF you pass in a host. It's an optional parameter
var program : ts.Program = 
  ts.createProgram(['../../test/hello.ts'], transpiler.getCompilerOptions());
transpiler.walk(source, program);
