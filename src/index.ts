import { readFileSync } from "fs";
import path from "path";
import ts, { factory } from "typescript";

export default function transformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
	return (ctx: ts.TransformationContext) => (sourceFile: ts.SourceFile) => {
		return visitNodeAndChildren(sourceFile, program, ctx);
	};
}

function visitNodeAndChildren(node: ts.SourceFile, program: ts.Program, context: ts.TransformationContext): ts.SourceFile;
function visitNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node | undefined;
function visitNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext): ts.Node | undefined {
	return ts.visitEachChild(visitNode(node, program), (childNode) => visitNodeAndChildren(childNode, program, context), context);
}

function visitNode(node: ts.SourceFile, program: ts.Program): ts.SourceFile;
function visitNode(node: ts.Node, program: ts.Program): ts.Node | undefined;
function visitNode(node: ts.Node, program: ts.Program): ts.VisitResult<ts.Node> | undefined {
	if (isModuleImportDeclaration(node, program)) return factory.createEmptyStatement();
	return node;
}

const sourceText = readFileSync(path.join(__dirname, "..", "index.d.ts"), "utf-8");
console.log(sourceText);

function isModule(sourceFile: ts.SourceFile) {
	console.log(sourceFile.text);
	return sourceFile.getFullText() === sourceText;
}

function getImportedSourceFile(importDeclaration: ts.ImportDeclaration, sourceFile: ts.SourceFile, program: ts.Program): ts.SourceFile | undefined {
	// Extract the module specifier text (e.g. "./module")
	const moduleName = (importDeclaration.moduleSpecifier as ts.StringLiteral).text;
	const compilerOptions = program.getCompilerOptions();

	// Resolve the module name relative to the current file
	const resolvedModule = ts.resolveModuleName(moduleName, sourceFile.fileName, compilerOptions, ts.sys).resolvedModule;
	if (resolvedModule) {
		console.log(resolvedModule.resolvedFileName);
		return program.getSourceFile(resolvedModule.resolvedFileName);
	}
	return undefined;
}

function isModuleImportDeclaration(node: ts.Node, program: ts.Program): node is ts.ImportDeclaration {
	if (!ts.isImportDeclaration(node)) return false;
	if (!node.importClause) return false;

	const namedBindings = node.importClause.namedBindings;
	if (!node.importClause.name && !namedBindings) return false;

	const source = getImportedSourceFile(node, node.getSourceFile(), program);
	if (!source) return true;

	return isModule(source);
}
