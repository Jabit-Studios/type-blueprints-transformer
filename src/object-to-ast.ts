import { Type, ts } from "ts-morph";

export function generateIIFEExpressionFromType(type: Type): ts.Expression {
	let objCounter = 0;
	// Map to keep track of already visited types (to handle cyclic references).
	const visited = new Map<Type, ts.Identifier>();
	// We'll accumulate variable declarations and assignment statements.
	const statements: ts.Statement[] = [];

	function traverse(t: Type): ts.Expression {
		// Base cases: if t is primitive, return a literal.
		if (t.isString()) {
			return ts.factory.createStringLiteral("string");
		}
		if (t.isNumber()) {
			return ts.factory.createStringLiteral("number");
		}
		if (t.isBoolean()) {
			return ts.factory.createStringLiteral("boolean");
		}
		if (t.isUndefined() || t.isNull()) {
			return ts.factory.createNull();
		}

		// Handle arrays.
		if (t.isArray()) {
			const arrayType = t.getArrayElementTypeOrThrow();
			const arrayExpr = traverse(arrayType);
			return ts.factory.createArrayLiteralExpression([ts.factory.createStringLiteral("Array"), arrayExpr]);
		}

		// Handle tuples.
		if (t.isTuple()) {
			const tupleExprs = t.getTupleElements().map((elem) => traverse(elem));
			return ts.factory.createArrayLiteralExpression([ts.factory.createStringLiteral("Tuple"), ...tupleExprs]);
		}

		// Handle unions.
		if (t.isUnion()) {
			const unionExprs = t.getUnionTypes().map((unionType) => traverse(unionType));
			return ts.factory.createArrayLiteralExpression([ts.factory.createStringLiteral("Union"), ...unionExprs]);
		}

		// Handle intersections.
		if (t.isIntersection()) {
			const intersectionExprs = t.getIntersectionTypes().map((intersectionType) => traverse(intersectionType));
			return ts.factory.createArrayLiteralExpression([ts.factory.createStringLiteral("Intersection"), ...intersectionExprs]);
		}

		// Check for cycles.
		if (visited.has(t)) {
			return visited.get(t)!;
		}

		// Create a new identifier for this non-primitive type.
		const varIdentifier = ts.factory.createIdentifier(`_obj${objCounter++}`);
		visited.set(t, varIdentifier);
		// Declare the variable with an empty object initializer.
		const varDeclaration = ts.factory.createVariableStatement(
			undefined,
			ts.factory.createVariableDeclarationList([ts.factory.createVariableDeclaration(varIdentifier, undefined, undefined, ts.factory.createObjectLiteralExpression([], true))], ts.NodeFlags.Const),
		);
		statements.push(varDeclaration);

		// Process each property of the type.
		const properties = t.getProperties();
		for (const prop of properties) {
			const declarations = prop.getDeclarations();
			if (declarations.length === 0) continue;
			// Use the type from the first declaration.
			const propType = declarations[0].getType();
			const propExpr = traverse(propType);
			// Create an assignment: _objX.propName = <propExpr>;
			const assignment = ts.factory.createExpressionStatement(ts.factory.createBinaryExpression(ts.factory.createPropertyAccessExpression(varIdentifier, prop.getName()), ts.SyntaxKind.EqualsToken, propExpr));
			statements.push(assignment);
		}

		return varIdentifier;
	}

	// Start processing from the root type.
	const rootExpr = traverse(type);
	// Return the root variable.
	statements.push(ts.factory.createReturnStatement(rootExpr));

	// Create an arrow function with no parameters that contains all our generated statements.
	const arrowFunc = ts.factory.createArrowFunction(undefined, undefined, [], undefined, ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), ts.factory.createBlock(statements, true));

	// Immediately invoke the arrow function.
	return ts.factory.createCallExpression(ts.factory.createParenthesizedExpression(arrowFunc), undefined, []);
}
