import * as ts from 'typescript';

export const isFunctionCall = (node: ts.Node, name: string): node is ts.CallExpression => {
    return ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name;
}