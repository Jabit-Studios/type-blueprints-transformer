import { $stamp } from "../../..";
import { $terrify } from "./test";

interface SingleDeep {
	a: SingleDeep;
}

const singleDeep = $stamp<SingleDeep>();
