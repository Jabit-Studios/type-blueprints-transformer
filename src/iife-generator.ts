import * as ts from "typescript";

export function generateIIFEExpressionFromType(
  type: ts.Type,
  checker: ts.TypeChecker
): ts.Expression {
  let objCounter = 0;
  // Map to keep track of already visited types (to handle cyclic references).
  const visited = new Map<ts.Type, ts.Identifier>();
  // Accumulate variable declarations and assignment statements.
  const statements: ts.Statement[] = [];

  function traverse(t: ts.Type): ts.Expression {
    // Base cases: if t is a primitive, return a literal.
    if (t.flags & ts.TypeFlags.String || t.flags & ts.TypeFlags.StringLiteral) {
      return ts.factory.createStringLiteral("string");
    }
    if (t.flags & ts.TypeFlags.Number || t.flags & ts.TypeFlags.NumberLiteral) {
      return ts.factory.createStringLiteral("number");
    }
    if (t.flags & ts.TypeFlags.Boolean || t.flags & ts.TypeFlags.BooleanLiteral) {
      return ts.factory.createStringLiteral("boolean");
    }
    if ((t.flags & ts.TypeFlags.Undefined) || (t.flags & ts.TypeFlags.Null)) {
      return ts.factory.createStringLiteral("null");
    }

    // Handle arrays.
    if (isArrayType(t)) {
      const elementType = getElementTypeOfArrayType(t);
      const arrayExpr = elementType ? traverse(elementType) : ts.factory.createOmittedExpression();
      return ts.factory.createArrayLiteralExpression([
        ts.factory.createStringLiteral("Array"),
        arrayExpr,
      ]);
    }

    // Handle tuples.
    if (isTupleType(t)) {
      const tupleExprs = getTupleElementTypes(t).map((elem) => traverse(elem));
      return ts.factory.createArrayLiteralExpression([
        ts.factory.createStringLiteral("Tuple"),
        ...tupleExprs,
      ]);
    }

    // Handle unions.
    if (t.flags & ts.TypeFlags.Union) {
      const unionType = t as ts.UnionType;
      const unionExprs = unionType.types.map(traverse);
      return ts.factory.createArrayLiteralExpression([
        ts.factory.createStringLiteral("Union"),
        ...unionExprs,
      ]);
    }

    // Handle intersections.
    if (t.flags & ts.TypeFlags.Intersection) {
      const intersectionType = t as ts.IntersectionType;
      const intersectionExprs = intersectionType.types.map(traverse);
      return ts.factory.createArrayLiteralExpression([
        ts.factory.createStringLiteral("Intersection"),
        ...intersectionExprs,
      ]);
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
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            varIdentifier,
            undefined,
            ts.factory.createTypeReferenceNode("any"),
            ts.factory.createObjectLiteralExpression([], true)
          ),
        ],
        ts.NodeFlags.Const
      )
    );
    statements.push(varDeclaration);

    // Process each property of the type.
    const properties = checker.getPropertiesOfType(t);
    for (const prop of properties) {
      const declarations = prop.getDeclarations();
      if (!declarations || declarations.length === 0) continue;
      // Use the type from the first declaration.
      const decl = declarations[0];
      const propType = checker.getTypeOfSymbolAtLocation(prop, decl);
      const propExpr = traverse(propType);
      // Create an assignment: _objX.propName = <propExpr>;
      const assignment = ts.factory.createExpressionStatement(
        ts.factory.createBinaryExpression(
          ts.factory.createPropertyAccessExpression(varIdentifier, prop.getName()),
          ts.SyntaxKind.EqualsToken,
          propExpr
        )
      );
      statements.push(assignment);
    }

    return varIdentifier;
  }

  // Helper to detect if a type is an array type.
  function isArrayType(t: ts.Type): boolean {
    if (!(t.flags & ts.TypeFlags.Object)) return false;
    const objectType = t as ts.ObjectType;
    if (!(objectType.objectFlags & ts.ObjectFlags.Reference)) return false;
    const typeRef = t as ts.TypeReference;
    if (typeRef.target?.symbol) {
      return typeRef.target.symbol.getName() === "Array";
    }
    return false;
  }

  // Retrieve the element type from an array type.
  function getElementTypeOfArrayType(t: ts.Type): ts.Type | undefined {
    const typeRef = t as ts.TypeReference;
    if (typeRef.typeArguments && typeRef.typeArguments.length === 1) {
      return typeRef.typeArguments[0];
    }
    return undefined;
  }

  // Helper to detect tuple types.
  function isTupleType(t: ts.Type): boolean {
    return !!(t.flags & ts.TypeFlags.Object && (t as ts.ObjectType).objectFlags & ts.ObjectFlags.Tuple);
  }

  // Retrieve tuple element types.
  function getTupleElementTypes(t: ts.Type): ts.Type[] {
    if (t.flags & ts.TypeFlags.Object && (t as ts.ObjectType).objectFlags & ts.ObjectFlags.Tuple) {
      const typeRef = t as ts.TypeReference;
      return Array.from(checker.getTypeArguments(typeRef));
    }
    return [];
  }

  // Start processing from the root type.
  const rootExpr = traverse(type);
  // Return the root variable.
  statements.push(ts.factory.createReturnStatement(rootExpr));

  // Create an arrow function with no parameters that contains all generated statements.
  const arrowFunc = ts.factory.createArrowFunction(
    undefined,
    undefined,
    [],
    undefined,
    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    ts.factory.createBlock(statements, true)
  );

  // Immediately invoke the arrow function.
  return ts.factory.createCallExpression(
    ts.factory.createParenthesizedExpression(arrowFunc),
    undefined,
    []
  );
}
