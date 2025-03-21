import { Type } from "ts-morph";

export interface ITypeConverter {
	convert(type: Type): any;
}

export class TypeConverter implements ITypeConverter {
	// Cache to avoid infinite recursion (flyweight pattern)
	private readonly cache = new Map<Type, any>();

	public convert(type: Type): any {
		// If we've already converted this type, return the cached value.
		if (this.cache.has(type)) {
			return this.cache.get(type);
		}

		// Early exit for primitive types.
		// You can expand this set to include other primitives if needed.
		const primitiveTypes = new Set(["string", "number", "boolean", "bigint", "symbol", "null", "undefined"]);
		const typeText = type.getText();
		if (primitiveTypes.has(typeText)) {
			this.cache.set(type, typeText);
			return typeText;
		}

		// Temporarily mark this type as visited to detect cycles.
		this.cache.set(type, "[Circular]");

		let result: any;

		// Strategy: Handle array types.
		if (type.isArray()) {
			const elementType = type.getArrayElementType();
			result = elementType ? [this.convert(elementType)] : [];
			this.cache.set(type, result);
			return result;
		}

		// Get properties of the type.
		const properties = type.getProperties();
		if (properties.length === 0) {
			result = type.getText();
			this.cache.set(type, result);
			return result;
		}

		// Composite: Process complex types by recursively converting each property.
		result = {} as Record<string, any>;
		// Cache the result early to handle cyclic references.
		this.cache.set(type, result);

		for (const prop of properties) {
			const declarations = prop.getDeclarations();
			if (declarations.length > 0) {
				const propType = prop.getTypeAtLocation(declarations[0]);
				result[prop.getName()] = this.convert(propType);
			}
		}

		return result;
	}
}
