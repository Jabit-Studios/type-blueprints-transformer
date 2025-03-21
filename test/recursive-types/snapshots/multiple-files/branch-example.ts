export interface IVirtualBranchDTO {
	index: number;
	depth: number;
	children: Array<IVirtualBranchDTO> | undefined;
}
