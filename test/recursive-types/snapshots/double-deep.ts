import { $stamp } from "../../..";

interface DoubleDeep {
	a: DoubleDeep;
	b: {
		c: DoubleDeep;
		d: number;
	};
}

const doubleDeep = $stamp<DoubleDeep>();
