import ts from "typescript";
import transformer from "../../src";
import { readFileSync } from "fs";


// A helper to create an in-memory Program for our source string.
function createProgram(source: string, fileName = 'test.ts'): ts.Program {
	const compilerOptions: ts.CompilerOptions = {
	  module: ts.ModuleKind.CommonJS,
	  target: ts.ScriptTarget.ES2015,
	  strict: true,
	};
  
	// Create a compiler host that returns our in-memory file.
	const host = ts.createCompilerHost(compilerOptions);
	host.getSourceFile = (name, languageVersion) => {
	  if (name === fileName) {
		return ts.createSourceFile(name, source, languageVersion, true);
	  }
	  // For lib files, delegate to the default read.
	  const libSource = ts.sys.readFile(name);
	  return libSource ? ts.createSourceFile(name, libSource, languageVersion, true) : undefined;
	};
  
	return ts.createProgram([fileName], compilerOptions, host);
  }
  
  // Function that applies our transformer to the source code.
  function transformSource(source: string, fileName: string): string {
	const program = createProgram(source, fileName);
	const transform = transformer(program);
	const sourceFile = program.getSourceFile(fileName);
	if (!sourceFile) {
	  throw new Error(`File not found: ${fileName}`);
	}

	const { transformed } = ts.transform(sourceFile, [transform]);
	const printer = ts.createPrinter();
	return printer.printFile(transformed[0] as ts.SourceFile);
  }

export function compile(fileName: string): string {
	const file = readFileSync(fileName, "utf-8");
	return transformSource(file, fileName);
}
