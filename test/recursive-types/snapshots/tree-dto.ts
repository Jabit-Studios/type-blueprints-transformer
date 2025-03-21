import { $stamp } from "../../..";

interface IVirtualBranchDTO {
	index: number;
	depth: number;
	children: Array<IVirtualBranchDTO> | undefined;
}

interface IVirtualTreeInformationDTO {
	seed?: number;
	maxDepth: number;
}

interface IVirtualTreeDTO extends IVirtualTreeInformationDTO {
	root: IVirtualBranchDTO;
}

const blueprint = $stamp<IVirtualTreeDTO>();
