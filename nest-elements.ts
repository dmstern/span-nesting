/*
 *
 * Here starts the part for the nesting
 *
 * */

interface ClassGroupMapping {
    classKey: string;
    spans: Element[];
}

function sortSpansBySize(a: ClassGroupMapping, b: ClassGroupMapping) {
    const firstSize = a.spans.length;
    const secondSize = b.spans.length;

    if (firstSize < secondSize) {
        return -1;
    }

    if (firstSize > secondSize) {
        return 1;
    }

    return 0;
}

function groupByClass(spans: Element[]): ClassGroupMapping[] {
    const allClasses = [...spans].map((span) => [...span.classList]).flat();
    const uniqueClasses = new Set(allClasses);
    const groupedLogicSpans = [...uniqueClasses].map((cssClass) => {
        return {
            classKey: cssClass,
            spans: [...spans].filter((span) => span.classList.contains(cssClass)),
        };
    });

    return cleanupGroupings(groupedLogicSpans);
}

function containSpansWithClass(classGroupMapping: ClassGroupMapping, classKey: string) {
    return classGroupMapping.spans.some((span) => span.classList.contains(classKey));
}

function cleanupGroupings(groupedLogicSpans: ClassGroupMapping[]): ClassGroupMapping[] {
    const result: ClassGroupMapping[] = [];

    groupedLogicSpans.forEach((groupedLogicSpan) => {
        const allMatchingGroups = groupedLogicSpans.filter((group) =>
            containSpansWithClass(group, groupedLogicSpan.classKey),
        );
        const sorted = allMatchingGroups.sort(sortSpansBySize);
        const biggest = sorted.at(-1);
        const resultContainsSpan = result.some((group) => containSpansWithClass(group, groupedLogicSpan.classKey));

        if (!resultContainsSpan && biggest) {
            result.push(biggest);
        }
    });

    return result;
}

function haveOverlappingClass(firstElement: Element, secondElement: Element): boolean {
    return [...firstElement.classList].some((clazz) => secondElement.classList.contains(clazz));
}

function getNextElementsTillOnlySingleClass(elements: Element[], classKey: string): Element[] {
    const nextElements: Element[] = [elements[0]];
    for (let i = 1; i < elements.length; i++) {
        if (elements[i].classList.length > 1) {
            const elementWithoutClass = elements[i].cloneNode(true) as Element;
            elementWithoutClass.classList.remove(classKey);
            nextElements.push(elementWithoutClass);
        } else {
            return nextElements;
        }
    }
    return nextElements;
}

function nestGroupedSpans(classKey: string, flatSpans: Element[]) {
    const spanWrapper = document.createElement("span");
    spanWrapper.classList.add(classKey);

    flatSpans.forEach((flatSpan) => {
        const hasOnlyClassKeyClass = flatSpan.classList.length === 1 && flatSpan.classList.contains(classKey);

        if (hasOnlyClassKeyClass) {
            const textNode = document.createTextNode(flatSpan.innerHTML);
            spanWrapper.append(textNode);
        } else {
            flatSpan.classList.remove(classKey);
            const spanWrapperContainsFlatSpan = haveOverlappingClass(spanWrapper, flatSpan);
            const spanWrapperChildContainsFlatSpan = [...spanWrapper.children].some((child) =>
                haveOverlappingClass(child, flatSpan),
            );

            if (!spanWrapperContainsFlatSpan && !spanWrapperChildContainsFlatSpan) {
                // create new wrapper, which has the following conditions:
                // - contains everything, which comes after flatspan till there is a span with only class = "classkey"
                // - classKey gets removed as class from all other spans
                const index = flatSpans.indexOf(flatSpan);
                const nextSiblings = getNextElementsTillOnlySingleClass(flatSpans.slice(index), classKey);
                // we have to nest even deeper
                const nestingIsFinished = nextSiblings.length === 1 && nextSiblings[0].classList.length === 1;
                if (nestingIsFinished) {
                    spanWrapper.append(flatSpan.cloneNode(true));
                } else {
                    const newNode = document.createElement("p");
                    newNode.append(...nextSiblings);
                    const nested = nestElements(newNode); //todo check for recursion deepness?
                    spanWrapper.append(...nested.childNodes);
                }
            }
        }
    });

    return spanWrapper;
}

function assembleNewParagraph(node: Element, nestedSpans: HTMLSpanElement[]): Element {
    const newNode = document.createElement("p");

    [...node.childNodes].forEach((child) => {
        const isTextNode = !(child instanceof Element);

        if (isTextNode) {
            newNode.append(child.cloneNode());
        } else {
            replaceSimilarSpansWithNestedSpan(newNode, child, nestedSpans);
        }
    });
    // If there are no ChildElements (in the deepest or lowest idk?) we still need to add the nestedSpans
    replaceSimilarSpansWithNestedSpan(newNode, null, nestedSpans);

    return newNode;
}

function replaceSimilarSpansWithNestedSpan(node: Element, child: Element | null, nestedSpans: HTMLSpanElement[]) {
    const isSpanAlreadyAdded =
        node.childNodes.length > 1 &&
        child !== null &&
        [...child.classList].every((currentClass) => {
            return !!node.querySelector(`.${currentClass}`);
        });

    if (isSpanAlreadyAdded) {
        return;
    }

    const nextNestedSpan = nestedSpans.shift();

    if (nextNestedSpan) {
        node.append(nextNestedSpan.cloneNode(true));
    }
}

function nestElements(parent: Element) {
    const children = parent.querySelectorAll("span");
    const classGroupMappings = groupByClass([...children]); // TODO maybe just call once and not recursive

    const nestedSpans = classGroupMappings.map(({classKey, spans}) => {
        const nestedSpan = nestGroupedSpans(classKey, spans);
        return nestedSpan;
    });

    const newParagraph = assembleNewParagraph(parent, nestedSpans);
    return newParagraph;
}


const button = document.getElementById("nest-button")

button.addEventListener("click", () => {
    const paragraphs = document.querySelectorAll("p");
    paragraphs.forEach((p) => {
        const newParagraph = nestElements(p);
        p.replaceWith(newParagraph);
    })
})
