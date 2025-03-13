import { $stamp } from "../../..";

interface SingleDeep {
	a: SingleDeep;
}

const singleDeep = $stamp<SingleDeep>();
