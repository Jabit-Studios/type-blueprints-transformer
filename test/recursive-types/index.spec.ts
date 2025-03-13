import { readFileSync } from "fs";
import { it, describe, expect } from "vitest";
import { compile } from "../util";

describe("Recursive Types", () => {
	it("should allow for one level deep recursion", () => {
		const output = compile("test/recursive-types/snapshots/single-deep.ts");
		expect(output).toMatchSnapshot();
	});
});
