/*
 *
 * Here starts the part for the nesting
 *
 * */


function haveOverlappingClass(firstElement: Element, secondElement: Element): boolean {
    return [...firstElement.classList].some((clazz) => secondElement.classList.contains(clazz));
}

function getOverlappingClass(elements: HTMLSpanElement[]): string | undefined {
    return [...elements[0].classList.values()].find((clazz) => elements.every((el) => el.classList.contains(clazz)));
}

function getSpansWithOverlappingClasses(element: HTMLSpanElement, elements: NodeListOf<HTMLSpanElement>) {
    const spansWithSameClasses: HTMLSpanElement[] = [];
    elements.forEach((span) => {
        if (haveOverlappingClass(element, span)) {
            spansWithSameClasses.push(span);
        }
    });
    return spansWithSameClasses;
}

function appendElement(baseElement: HTMLSpanElement, appendElement: HTMLSpanElement) {
    if (appendElement.classList.length === 0) {
        baseElement.innerHTML += appendElement.innerHTML;
    } else {
        baseElement.append(appendElement.cloneNode(true));
    }
}

function replaceMultipleSpansWithSingleSpan(spans: HTMLSpanElement[], mergedSpan: HTMLSpanElement) {
    spans[0].replaceWith(mergedSpan);
    for (let i = 1; i < spans.length; i++) {
        spans[i].remove();
    }
}

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

function mergeElements(elements: HTMLSpanElement[]) {
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
    for (let i = 0; i < spans.length; i++) {
        const currentSpan = spans[i];
        let mergedSpan: HTMLSpanElement;
        const spansWithSameClasses: HTMLSpanElement[] = getSpansWithOverlappingClasses(currentSpan, spans);
        if (spansWithSameClasses.length > 1) {
            mergedSpan = mergeElements(spansWithSameClasses);
        } else {
            mergedSpan = mergeSingleElement(currentSpan);
        }
        replaceMultipleSpansWithSingleSpan(spansWithSameClasses, mergedSpan);
        spans = parent.querySelectorAll("span");
    }

    parent.querySelectorAll("span").forEach((span: Element) => {
        removeUidFromClasses(span);
    });
    parent.querySelectorAll("span").forEach((span: Element) => {
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
