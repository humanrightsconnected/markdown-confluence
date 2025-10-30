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
 * Return a new ADF tree with all node marks sorted for consistent comparison.
 * @param adf The input ADF tree/entity.
 * @returns ADF with marks sorted.
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
 * Compare two ADF documents, ignoring mark order and nested collection order.
 * @param first First ADF entity or tree
 * @param second Second ADF entity or tree
 * @returns True if ADF structures are equal (ignoring mark order)
 */
export function adfEqual(first: ADFEntity, second: ADFEntity): boolean {
	return isEqual(orderMarks(first), orderMarks(second));
}

/**
 * Compare two mark arrays for deep equality (order-insensitive).
 * @param first Array of marks (or undefined)
 * @param second Array of marks (or undefined)
 * @returns True if the marks are deeply equal ignoring order
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
