import { readFileSync } from "fs";
import { join } from "path";
import { CallExpression, Node, Project, SourceFile, ts } from "ts-morph";
import { generateIIFEExpressionFromType } from "./object-to-ast";

function removeImportDeclaration(file: SourceFile, path: string): void {
	file.getImportDeclarations().forEach((importDeclaration) => {
		const importFile = importDeclaration.getModuleSpecifierSourceFile();
		const ourFile = readFileSync(path, "utf-8");

		// Check if the import declaration is pointing to the index.d.ts file
		// and if the text of the import file matches the text of our file
		// If so, remove the import declaration
		if (importFile && importFile.getFullText() === ourFile) {
			importDeclaration.remove();
		}
	});
}

function identifyCallExpressions(file: SourceFile, exprName: string): CallExpression[] {
	return file.getDescendantsOfKind(ts.SyntaxKind.CallExpression).filter((call) => {
		const expr = call.getExpression();
		return Node.isIdentifier(expr) && expr.getText() === exprName;
	});
}

function transform(program: ts.Program, context: ts.TransformationContext, sourceFile: ts.SourceFile): ts.SourceFile {
	// Create a new ts-morph project with the compiler options from the current program
	const project = new Project({
		compilerOptions: program.getCompilerOptions(),
		skipAddingFilesFromTsConfig: true,
	});

	// Create (or update) a ts-morph source file using the existing file text.
	const file = project.createSourceFile(sourceFile.fileName, sourceFile.getFullText(), { overwrite: true });

	// Apply transformations using ts-morph
	removeImportDeclaration(file, join(__dirname, "..", "index.d.ts"));

	// Identify and transform call expressions
	const callExpressions = identifyCallExpressions(file, "$stamp");
	callExpressions.forEach((call) => {
		const args = call.getTypeArguments();
		if (args.length !== 1) return;

		const arg = args[0];
		const ast = generateIIFEExpressionFromType(arg.getType());

		call.transform(() => ast);
	});

	return file.compilerNode;
}

export default function transformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
	return (context: ts.TransformationContext) => (sourceFile: ts.SourceFile) => {
		return transform(program, context, sourceFile);
	};
}
