import { $stamp } from "../../../..";
import { IVirtualBranchDTO } from "./branch-example";

interface IVirtualTreeInformationDTO {
	seed?: number;
	maxDepth: number;
}

interface IVirtualTreeDTO extends IVirtualTreeInformationDTO {
	root: IVirtualBranchDTO;
}

const blueprint = $stamp<IVirtualTreeDTO>();
