import sortAny from "sort-any";
import { mapValues } from "lodash-es";
import { traverse } from "@atlaskit/adf-utils/traverse";
import { ADFEntity, ADFEntityMark } from "@atlaskit/adf-utils/types";
import { isEqual } from "./isEqual";

/**
 * Recursively sorts arbitrary data structures (maps/objects/arrays), used to make deep comparison order-invariant.
 * Only stable for objects/arrays/maps, not functions or circular refs.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sortDeep = (object: unknown): any => {
	if (object instanceof Map) {
		return sortAny([...object]);
	}
	if (!Array.isArray(object)) {
		if (
			typeof object !== "object" ||
			object === null ||
			object instanceof Date
		) {
			return object;
		}

		return mapValues(object, sortDeep);
	}

	return sortAny(object.map(sortDeep));
};

/**
 * Produce an ADF tree where every node's `marks` array is sorted to enable order-insensitive comparisons.
 *
 * Traverses the provided ADF entity and replaces any `marks` arrays with their deeply sorted equivalents.
 *
 * @param adf - The input ADF entity to normalize
 * @returns The same ADF entity with each node's `marks` sorted
 */
export function orderMarks(adf: ADFEntity) {
	return traverse(adf, {
		any: (node, __parent) => {
			if (node.marks) {
				node.marks = sortDeep(node.marks);
			}
			return node;
		},
	});
}

/**
 * Determine whether two ADF documents are structurally equal while ignoring mark order and nested collection order.
 *
 * @param first - The first ADF entity or tree to compare
 * @param second - The second ADF entity or tree to compare
 * @returns `true` if the ADF structures are deeply equal when mark order and nested collection order are ignored, `false` otherwise
 */
export function adfEqual(first: ADFEntity, second: ADFEntity): boolean {
	return isEqual(orderMarks(first), orderMarks(second));
}

/**
 * Determine whether two arrays of ADF marks are deeply equal regardless of mark order.
 *
 * @param first - The first array of marks, or `undefined`
 * @param second - The second array of marks, or `undefined`
 * @returns `true` if the two mark arrays contain the same marks regardless of order, `false` otherwise.
 */
export function marksEqual(
	first: ADFEntityMark[] | undefined,
	second: ADFEntityMark[] | undefined,
) {
	if (first === second) {
		return true;
	}

	return isEqual(sortDeep(first), sortDeep(second));
}