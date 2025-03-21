import { $stamp } from "../../..";
import { $terrify } from "./test";

interface SingleDeep {
	a: SingleDeep;
	b: number;
}

const singleDeep = $stamp<SingleDeep>();
$terrify(singleDeep);
