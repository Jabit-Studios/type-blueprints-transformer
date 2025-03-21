import { $stamp } from "../../..";
import { $terrify } from "./test";

interface DoubleDeep {
	a: DoubleDeep;
	b: {
		c: DoubleDeep;
		d: number;
	};
}

const doubleDeep = $stamp<DoubleDeep>();
$terrify(doubleDeep);