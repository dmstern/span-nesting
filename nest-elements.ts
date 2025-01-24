/*
 *
 * Here starts the part for the nesting
 *
 * */


/**
 * Determines if two {@link Element} share at least one overlapping CSS class.
 *
 * This function checks if there is any common class between the two provided HTML elements
 * by iterating over the class list of the first element and checking for the presence of
 * each class in the class list of the second element.
 *
 * @param firstElement - The first {@link Element} to compare.
 * @param secondElement - The second {@link Element} to compare.
 * @returns {boolean} - Returns true if the two elements share at least one class, otherwise false.
 *
 */
function haveOverlappingClass(firstElement: Element, secondElement: Element): boolean {
    return [...firstElement.classList].some((clazz) => secondElement.classList.contains(clazz));
}

/**
 * Finds the first CSS class that is shared by all the provided {@link HTMLSpanElement} array.
 *
 * This function iterates through the class list of the first element in the array
 * and checks if every other element in the array contains the same class. If a common
 * class is found, it is returned; otherwise, undefined is returned.
 *
 * @param elements - An array of {@link HTMLSpanElement} objects to compare.
 * @returns {string | undefined} - Returns the first class that is common to all elements, or undefined if no common class is found.
 *
 */
function getOverlappingClass(elements: HTMLSpanElement[]): string | undefined {
    return [...elements[0].classList.values()].find((clazz) => elements.every((el) => el.classList.contains(clazz)));
}

/**
 * Checks whether a given {@link Node} is a non-element node with empty or whitespace-only text content.
 *
 * @param node - The {@link Node} to check.
 * @returns {boolean} - Returns true if the node is not an Element and its trimmed text content is empty or undefined, otherwise false.
 *
 */
function isEmptyTextNode(node: Node): boolean {
    const isNoElement = !(node instanceof Element);
    const trimmedTextContent = node.textContent?.trim();
    const trimmedTextContentIsEmpty = !trimmedTextContent?.length || trimmedTextContent.length === 0;
    return isNoElement && trimmedTextContentIsEmpty;
}

/**
 * Finds the next sibling of a given {@link HTMLSpanElement}, ignoring text nodes that are empty or contain only whitespace.
 *
 * This function iterates through the siblings of the provided element, skipping over text nodes
 * that contain only whitespace or no content at all. If a valid sibling is found, and it is an Element, it is returned;
 * otherwise, null is returned.
 *
 * @param element - The {@link HTMLSpanElement} whose next sibling is to be found.
 * @returns Returns the next sibling {@link Element} that is not an empty or whitespace-only text node, or null if none exists.
 *
 */
function getNextSiblingIgnoreWhiteSpaceTextNodes(element: HTMLSpanElement): Element | null {
    let returnVal = null;
    let curVal: Node = element;
    while (curVal.nextSibling && isEmptyTextNode(curVal.nextSibling)) {
        curVal = curVal.nextSibling;
    }
    if (curVal.nextSibling instanceof Element) {
        returnVal = curVal.nextSibling;
    }
    return returnVal;
}

/**
 * Finds neighboring span elements with overlapping CSS classes, starting from the given element.
 * <p>
 * This function identifies span elements in the provided NodeList that:
 * <ul>
 *   <li>Share at least one overlapping CSS class with the starting element.</li>
 *   <li>Are directly adjacent to each other, skipping whitespace-only text nodes.</li>
 * </ul>
 * The search begins with the provided element and proceeds sequentially through the NodeList, adding
 * each valid neighboring span to the result array.
 * </p>
 *
 * @param element the initial {@link HTMLSpanElement} to start the search from.
 * @param elements a {@link NodeList} of {@link HTMLSpanElement} objects to check for overlapping classes.
 * @return an array of {@link HTMLSpanElement} objects that share at least one CSS class with the initial element
 *         and are direct neighbors (ignoring whitespace-only text nodes).
 *
 */
function getNeighbouringSpansWithOverlappingClasses(element: HTMLSpanElement, elements: NodeListOf<HTMLSpanElement>): HTMLSpanElement[] {
    const spansWithSameClasses: HTMLSpanElement[] = [];
    let currentSpan = element;
    spansWithSameClasses.push(currentSpan);
    elements.forEach((span) => {
        if (haveOverlappingClass(element, span) && span.isEqualNode(getNextSiblingIgnoreWhiteSpaceTextNodes(currentSpan))) {
            currentSpan = span;
            spansWithSameClasses.push(currentSpan);
        }
    });
    return spansWithSameClasses;
}

/**
 * Appends the content of one HTML span element to another.
 * <p>
 * This function appends the content of the `appendElement` to the `baseElement`:
 * <ul>
 *   <li>If the `appendElement` has no CSS classes, its innerHTML is directly added to the `baseElement`'s innerHTML.</li>
 *   <li>If the `appendElement` has CSS classes, a cloned version of the `appendElement` (including its attributes and children)
 *       is appended to the `baseElement`.</li>
 * </ul>
 * </p>
 *
 * @param baseElement - The {@link HTMLSpanElement} to which content will be appended.
 * @param appendElement - The {@link HTMLSpanElement} whose content will be appended.
 *
 */
function appendElement(baseElement: HTMLSpanElement, appendElement: HTMLSpanElement) {
    if (appendElement.classList.length === 0) {
        baseElement.innerHTML += appendElement.innerHTML;
    } else {
        baseElement.append(appendElement.cloneNode(true));
    }
}
/**
 * Replaces multiple HTML span elements with a single span element.
 * <p>
 * This function replaces the first span in the `spans` array with the `mergedSpan` and removes
 * all subsequent spans from the DOM. It ensures that the `mergedSpan` takes the place of the
 * first span, while eliminating all other spans to avoid duplication in the document.
 * </p>
 *
 * @param spans - An array of {@link HTMLSpanElement} objects to be replaced.
 * @param mergedSpan - The {@link HTMLSpanElement} that will replace the provided spans.
 *
 **/
function replaceMultipleSpansWithSingleSpan(spans: HTMLSpanElement[], mergedSpan: HTMLSpanElement) {
    spans[0].replaceWith(mergedSpan);
    for (let i = 1; i < spans.length; i++) {
        spans[i].remove();
    }
}


/**
 * Merges the CSS classes of a span element into a nested structure of spans and retains the innerHTML.
 * <p>
 * This function takes an input span element and creates a nested structure of span elements
 * where each class in the `classList` of the input span is represented by a separate span.
 * The innermost span retains the original `innerHTML` of the input span.
 * </p>
 *
 * Example:
 * Before:
 * ```
 * <span class="class1 class2 class3">Hello</span>
 * ```
 *
 * After:
 * ```
 * <span class="class1">
 *   <span class="class2">
 *     <span class="class3">Hello</span>
 *   </span>
 * </span>
 * ```
 * @param span - The {@link HTMLSpanElement} whose classes and content will be transformed.
 * @returns {HTMLSpanElement} - A new {@link HTMLSpanElement} representing the nested structure.
 *
 */
function mergeSingleElement(span: HTMLSpanElement): HTMLSpanElement {
    const returnVal = document.createElement("span") as HTMLSpanElement;
    let currentSpan: HTMLSpanElement = returnVal;
    let nestedSpan: HTMLSpanElement;
    span.classList.forEach((className) => {
        nestedSpan = document.createElement("span");
        nestedSpan.classList.add(className);
        currentSpan.append(nestedSpan);
        currentSpan = nestedSpan;
    });
    currentSpan.innerHTML = span.innerHTML;
    return returnVal.firstElementChild as HTMLSpanElement;
}

/**
 * Merges an array of HTMLSpanElement elements into a single HTMLSpanElement.
 *
 * This function creates a new span element and assigns it a class if there is an overlapping class
 * among the provided elements. It then removes the overlapping class from the original elements
 * and appends them to the new span element.
 * Example:
 * Before:
 * ```
 * <span class="class1">Start</span>
 * <span class="class1 class2 class3">Middle</span>
 * <span class="class1">End</span>
 * ```
 *
 * After:
 * ```
 * <span class="class1">
 *   Start
 *   <span class="class2 class3">Middle</span>
 *   End
 * </span>
 * ```
 *
 *
 * @param {HTMLSpanElement[]} elements - An array of {@link HTMLSpanElement} elements to be merged.
 * @returns {HTMLSpanElement} - A new {@link HTMLSpanElement} containing the merged elements.
 *
 */
function mergeElements(elements: HTMLSpanElement[]): HTMLSpanElement {
    const returnVal: HTMLSpanElement = document.createElement("span");
    const overLappingClass = getOverlappingClass(elements);
    if (overLappingClass) {
        returnVal.classList.add(overLappingClass);
        elements.forEach((element) => {
            element.classList.remove(overLappingClass);
            appendElement(returnVal, element);
        });
    } else {
        console.error("At this there should always be an overlapping class.");
    }

    return returnVal;
}

function removeUidFromClasses(element: Element) {
    const newClsList: string[] = [...element.classList.values()];
    newClsList.forEach((cls) => {
        const classWithoutUID = cls.replace(/(.*logic--.+)_.+/, "$1").replace(/(.*citation--.+)_.+/, "$1");
        element.classList.replace(cls, classWithoutUID);
    });
}

/**
 * This function will merge children-span-elements of the parents if they have an overlapping class.
 * It transforms html of the form
 * ```
 * <p>
 *   Text
 *   <span class=a>A</span>
 *   <span class=a b>AB</span>
 *   Text
 *    <span class=c d e>CDE</span>
 *    Text
 * </p>
 * ```
 * to html of the form
 * ```
 * <p>
 *   Text
 *    <span class=a>A
 *      <span class=b>AB</span>
 *    </span>
 *   Text
 *   <span class=c>
 *    <span class=d>
 *     <span class=d>CDE</span>
 *    </span>
 *   </span>
 *   Text
 * </p>
 *
 * ```
 * It follows the following logic:
 * Grab all spans which there are. Take the first one and do the following:
 * Collect all the spans which have an overlapping class.We know that the spans with overlapping classes are all
 * direct siblings of each other and all have a common class.
 * In case there is no other span which has an overlapping class, we have to merge the currentSpan just in itself.
 * If there are other spans with an overlapping class, we take all the spans and merge them in one span, which has
 * the overlapping class as classAttribute.
 * Now the structure of the parent may have changed, but we know, that the currentSpan is correctly nested, and we can
 * take the next span and do the above described procedure till we have nested all spans.
 *
 * @param parent
 */
function nestElements(parent: Element) {
    let spans = parent.querySelectorAll("span");
    // We use a for-loop instead of forEach, since we change the spans element at each iteration which is not advised
    // for functional programming.
    for (let i = 0; i < spans.length; i++) {
        const currentSpan = spans[i];
        const spansWithSameClasses: HTMLSpanElement[] = getNeighbouringSpansWithOverlappingClasses(currentSpan, spans);
        const mergedSpan =
            spansWithSameClasses.length > 1 ? mergeElements(spansWithSameClasses) : mergeSingleElement(currentSpan);
        replaceMultipleSpansWithSingleSpan(spansWithSameClasses, mergedSpan);
        spans = parent.querySelectorAll("span");
    }

    // You must not do removeUidFromClasses(span) and  span.outerHTML = span.outerHTML.replaceAll(/\s+xmlns="[^"]*"/g, "")
    // in the same forEach loop, since the change of outerHTML changes the containedSpans, and it could happen, that the
    // uid does not get removed from all spans
    const containedSpans = parent.querySelectorAll("span")
    containedSpans.forEach((span: Element) => {
        removeUidFromClasses(span);
    });
    containedSpans.forEach((span: Element) => {
        span.outerHTML = span.outerHTML.replaceAll(/\s+xmlns="[^"]*"/g, "");
    });
    return parent;
}


const button = document.getElementById("nest-button")

button.addEventListener("click", () => {
    const paragraphs = document.querySelectorAll("p");
    paragraphs.forEach((p) => {
        const newParagraph = nestElements(p);
        p.replaceWith(newParagraph);
    })
})
