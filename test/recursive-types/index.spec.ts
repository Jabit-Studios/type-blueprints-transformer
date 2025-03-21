import { it, describe, expect } from "vitest";
import { compileFromFile } from "../util";

describe("Recursive Types", () => {
	it("should allow for one level deep recursion", () => {
		const output = compileFromFile("test/recursive-types/snapshots/single-deep.ts");
		expect(output).toMatchSnapshot();
	});
});
