import { describe, expect, it } from "vitest";
import { compileFromFile } from "../util";

describe("Recursive Types", () => {
	it("should allow for one level deep recursion", () => {
		const output = compileFromFile("test/recursive-types/snapshots/single-deep.ts");
		expect(output).toMatchSnapshot("single-deep.ts");
	});

	it("should allow for two levels deep recursion", () => {
		const output = compileFromFile("test/recursive-types/snapshots/double-deep.ts");
		expect(output).toMatchSnapshot("double-deep.ts");
	});

	it("should allow for complex recursion", () => {
		const output = compileFromFile("test/recursive-types/snapshots/tree-dto.ts");
		expect(output).toMatchSnapshot("tree-dto.ts");
	});

	it("should allow for complex recursion from multiple files", () => {
		const output = compileFromFile("test/recursive-types/snapshots/multiple-files/tree-example.ts");
		expect(output).toMatchSnapshot("tree-dto-multiple-files.ts");
	});
});
