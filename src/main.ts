///<reference path="../typings/node/node.d.ts"/>
///<reference path="../typings/typescript/typescript.d.ts"/>

import ts = require('typescript');
import fs = require('fs'); // filesystem module
import fsx = require('fs-extra');
import util = require('util');
import path = require('path');

/* TranspilerOptions Class will go here */

/* The Transpiler Class */
export class Renamer {
  private output: string; // for now, what is an output object?
  private currentFile: ts.SourceFile;

  /*
   * "StupidMode" will rename properties indiscriminantly. If anything is named "foo", it will be
   * renamed to global new name for "foo".
   */
  stupidMode: boolean;

  /* 
   * List of properties, and their remappings. Key is the property name, value is a PropertyInfo 
   * object which has what type its parent is (left hand side expression) and its new name. 
   */
  renameMap = new Map();
  /* 
   * List of "root" names, and the last property name assigned to one of its properties.
   * ie: Foo is a class. Foo has properties x, y, z which were renamed to a, b, c. 
   * { Foo: 'c' } allows easy access to Foo's last renamed property so we can use 
   * getNextLateralPropertyName per Class/"root".
   */
  prevNameMap = new Map();


  /* Not sure if needed */
  nodes: ts.Node[] = [];

  /* Not needed as of now */
  private errors: string[] = [];


  constructor() {
    /* nothing here yet */
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
    var fileMap: { [s: string]: boolean } = {};
    fileNames.forEach((f) => fileMap[f] = true); // why?

    // sanity check that given files actually exist
    // take this out later.
    fileNames.forEach((fpath) => {
      fs.exists(fpath, function(exists) {
        console.log(fpath);
        console.log(exists ? "exists\n" : "nope :(\n");
      });
    });

    /* the methods of a compiler host object */
    return {
      getSourceFile: (sourceName, languageVersion) => {
        if (fileMap.hasOwnProperty(sourceName)) {
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

  /* TODO: We want to take the filenames and output the 
   * renamed files in the same directory (for now). Therefore, destination parameter is unneeded. 
   */
  transpile(fileNames: string[], destination?: string): void {
    var host = this.createCompilerHost(fileNames);       
    // if (destination === undefined) {
    //   throw new Error('Must have a destination for emitted file');
    // }
    // var destinationRoot = destination || '';
    var program = ts.createProgram(fileNames, this.getCompilerOptions(), host);

    // Only write files that were explicitly passed in.
    var fileMap: {[s: string]: boolean} = {};
    fileNames.forEach((f) => fileMap[this.normalizeSlashes(f)] = true);

    this.errors = [];
    program.getSourceFiles()
        .filter((sourceFile) => fileMap[sourceFile.fileName])
        // Do not generate output for .d.ts files.
        .filter((sourceFile: ts.SourceFile) => !sourceFile.fileName.match(/\.d\.ts$/))
        .forEach((f: ts.SourceFile) => {
          /* TODO: Implement translate */
          /* var renamedCode = this.translate(f); */
          /* TODO: Implement getOutputPath */
          var outputFile = this.getOutputPath(f.fileName);
          //fsx.mkdirsSync(path.dirname(outputFile));
          fs.writeFileSync(outputFile, "testing");
        });
    /* TODO: Implmenent checkForErrors */
    /* this.checkForErrors(program); */
  }

  /* Walk the AST of the program */
  /* Pass in typechecker instead of program */
  walk(sourcefile: ts.SourceFile, typeChecker: ts.TypeChecker) {
    this.currentFile = sourcefile;
    var map = this.renameMap;

    ts.forEachChild(sourcefile, function(node) {
      traverse(node, typeChecker, map, '');
    });

    /* Somewhat of a misnomer to refer to pString as "parent" */
    function traverse(node: ts.Node, typeChecker: ts.TypeChecker, renameMap, pString: string) {
      switch (node.kind) {
        case ts.SyntaxKind.ClassDeclaration:
          var cd = <ts.ClassDeclaration>node;
          pString = updateParentString(pString, cd.name.text);
          /* This returns undefined, but not really necessary to try to get the "type" of a Class */
          /* var symbol = typeChecker.getSymbolAtLocation(cd); */
          //console.log(cd);
          console.log('ClassDeclaration');
          break;
        case ts.SyntaxKind.PropertyAssignment:
          break;
        /* This is where we rename the property and add it to the dictionary */
        case ts.SyntaxKind.PropertyDeclaration:
          console.log('PropertyDeclaration ' + 'parent: ' + pString);
          var pd = <ts.PropertyDeclaration>node;
          pString = updateParentString(pString, pd.name.text);
          /* pd has a property type, pd.type can be passed to the typechecker to get type info */
          /* getType(pd.type); */
          break;
        case ts.SyntaxKind.Constructor:
          break;
        case ts.SyntaxKind.MethodDeclaration:
          break;
        case ts.SyntaxKind.ShorthandPropertyAssignment:
          break;
        case ts.SyntaxKind.BinaryExpression:
          break;
        case ts.SyntaxKind.Identifier:
          break;
        case ts.SyntaxKind.DotToken:
          break;
        case ts.SyntaxKind.PropertyAccessExpression:
          var pae = <ts.PropertyAccessExpression>node;
          console.log('==============================================');
          var lhs = pae.expression;
          console.log(pae);
          getType(pae);
          /* TODO: figure out how to get type of an expression */
          if (lhs.text) {
            console.log("PropertyAE lhs.text");
            pString = updateParentString(lhs.text + '$' + pae.name.text, pString);
            var symbol = typeChecker.getSymbolAtLocation(lhs);
            //getType(symbol.valueDeclaration.type);
          } else if (lhs.expression) {
            console.log("PropertyAE lhs.expression");
            pString = updateParentString(pae.name.text, pString);
            console.log('==============================================');
            var symbol = typeChecker.getSymbolAtLocation(lhs);
            //getType(symbol.valueDeclaration.type);
            console.log('==============================================');
          } else {
            console.log("PropertyAE else");
            pString = updateParentString(pString, pae.name.text);
          }
          break;
      }

      ts.forEachChild(node, function(node) {
        traverse(node, typeChecker, renameMap, pString);
      });
    }

    function getType(node: ts.Node): string {
      try {
        console.log("TYPECHECKER");
        console.log(typeChecker.typeToString(typeChecker.getTypeAtLocation(node)));
        return typeChecker.typeToString(typeChecker.getTypeAtLocation(node));
      } catch(error) {
        console.log("TYPECHECKER ERROR " + error.stack);
        return "error";
      }
    }

    function printMap(map: Map<any, any>) {
      console.log('============ Rename Map ===============');
      map.forEach(function(value, key) {
        console.log(key + " = " + value);
      }, map);
      console.log('============ Rename Map ===============');
    }

    /* Report information when necessary */
    function report(node: ts.Node, message: string) {
      var lc = sourcefile.getLineAndCharacterOfPosition(node.getStart());
      console.log('${sourcefile.fileName} (${lc.line + 1},${lc.character + 1}): ${message}');
    }

    /* Concat the 'parent' and 'child' strings */
    function updateParentString(p: string, c: string): string {
      if (p.length === 0) {
        return c;
      } else if (c.length === 0) {
        return p;
      } else {
        return p + '$' + c;
      }
    }
  }

  /* 
   * Given a char, generate the next character in the alphabet.
   */
  nextChar(c: string): string {
    return String.fromCharCode(c.charCodeAt(0) + 1);
  }

  /* Given the last code, returns a string for the new property name        */
  /* Ie: given 'a', will return 'b', given 'az', will return 'ba', etc. ... */
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
  assignNewPropertyName(propName: string, lhsType: string): void {
    var prevRename = this.getLastRename(lhsType);
    var newPropName = this.generateNextLateralPropertyName(prevRename);
    var value = new PropertyInfo(lhsType, newPropName);
    /* 
     * Add the PropertyInfo for the property name in a new list since this property name might
     * not be unique.
     */
    if (!this.renameMap.get(propName)) {
      this.renameMap.set(propName, [value]);
    } else {
      var arr = this.renameMap.get(propName);
      this.renameMap.set(propName, arr.push(value));
    }
    this.updateLastRename(lhsType, newPropName);
  }

  /* Update the last renamed property for the lhs expression */
  private updateLastRename(key: string, rename: string): void {
    this.prevNameMap.set(key, rename);
  }

  private getLastRename(key: string): string {
    /*
     * This LHS expression does not exist yet. Add it to the prevNameMap.
     */
    if (!this.prevNameMap.get(key)) {
      /* 
       * Set initial last property name to '' so 'a' can be generated correctly since
       * generateNextLateralPropertyName is based on the most recently generated name.
       */
      this.prevNameMap.set(key, '');
      return '';
    } else {
      return this.prevNameMap.get(key);
    }
  }

  private normalizeSlashes(path: string) { return path.replace(/\\/g, "/"); }

  getOutputPath(filePath: string): string {
    var parsedFile = path.parse(filePath);
    var renamedFile = parsedFile.dir + '/' + parsedFile.name + '-renamed' + parsedFile.ext;
    return renamedFile;
  }

}

/* Holds information about a property added to the rename map. 
 * Should this also have a field for the property's type?
 */
class PropertyInfo {
  private lhs: string;
  private newName: string;

  constructor(lhs: string, newName: string) {
    this.lhs = lhs;
    this.newName = newName;
  }

  getLHS(): string {
    return this.lhs;
  }

  getNewName(): string {
    return this.newName;
  }
}

class Output {
  private result: string = '';
  private column: number = 1;
  private line: number = 1;

  constructor(/* private currentFile: ts.SourceFile, private relativeFileName: string */) {}

  emit(str: string) {
    this.emitNoSpace(' ');
    this.emitNoSpace(str);
  }

  emitNoSpace(str: string) {
    this.result += str;
    for (var i = 0; i < str.length; i++) {
      if (str[i] === '\n') {
        this.line++;
        this.column = 0;
      } else {
        this.column++;
      }
    }
  }

  getResult(): string { return this.result; }
}

// var renamer = new Renamer();
// var host = renamer.createCompilerHost(['../../test/hello.ts']);
// console.log('created compiler host');
// var source : ts.SourceFile = host.getSourceFile('../../test/hello.ts', ts.ScriptTarget.ES6);

// // to create the program, the host calls getSourceFile 
// // IF you pass in a host. It's an optional parameter
// var program : ts.Program = 
//   ts.createProgram(['../../test/hello.ts'], renamer.getCompilerOptions());
// renamer.walk(source, program.getTypeChecker());

