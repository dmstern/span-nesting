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

function mergeSingleElement(span : HTMLSpanElement) : Element {
    let returnVal = document.createElement("span")
    let currentSpan = returnVal
    let nestedSpan :HTMLSpanElement
    span.classList.forEach((className) => {
        nestedSpan = document.createElement("span")
        nestedSpan.classList.add(className)
        currentSpan.append(nestedSpan);
        currentSpan = nestedSpan
    })
    currentSpan.innerHTML = span.innerHTML
    return returnVal.firstElementChild;

}

function getOverlappingClass(elements : Element[]) {
    return [...elements[0].classList.values()].find((clazz) => elements.every((el) => el.classList.contains(clazz)));
}
function mergeElements(elements:Element[]) {
    let returnVal : HTMLSpanElement = document.createElement("span");
    const overLappingClass = getOverlappingClass(elements)
    returnVal.classList.add(overLappingClass)
    elements.forEach((el) =>{
        el.classList.remove(overLappingClass)
            if(el.classList.length === 0) {
                returnVal.innerHTML += el.innerHTML
            } else {
                returnVal.append(el.cloneNode(true))
            }
    })
    return returnVal;

}

function nestElements(parent: Element) {
    let spans = parent.querySelectorAll("span");
    let i = 0
    while(i<spans.length){
        const spansWithSameClasses : Element[] = []
        const currentSpan = spans[i];
        spans.forEach((span) => {
            if(haveOverlappingClass(currentSpan, span)) {
            spansWithSameClasses.push(span)
            }
        })
        if(spansWithSameClasses.length > 1) {
            currentSpan.replaceWith(mergeElements(spansWithSameClasses))
            for (let j =1;j<spansWithSameClasses.length;j++) {
                spans[i+j].remove()
            }
        } else {
            currentSpan.replaceWith(mergeSingleElement(currentSpan))
            i++
        }
        spans = parent.querySelectorAll("span");
    }
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
