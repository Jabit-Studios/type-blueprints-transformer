import { readFileSync } from "node:fs";

export const readFile = (path: string): string => {
	return readFileSync(path, "utf8");
};
