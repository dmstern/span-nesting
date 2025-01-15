interface ClassGroupMapping {
  classKey: string;
  spans: Element[];
}

/**
 *
 * @param { {classKey: string; spans: Element[]} } a
 * @param { {classKey: string; spans: Element[]} } b
 */
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

/**
 *
 * @param {Element[]} spans
 * @returns { {classKey: string; spans: Element[]}[] }
 */
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

function containSpansWithClass(classGroupMapping: ClassGroupMapping) {
  return classGroupMapping.spans.some((span) => span.classList.contains(classGroupMapping.classKey));
}

/**
 * cleanup: avoid grouping spans that are already children of other groupings
 * @param { {classKey: string; spans: Element[]}[] } groupedLogicSpans
 */
function cleanupGroupings(groupedLogicSpans: ClassGroupMapping[]): ClassGroupMapping[] {
  const result: ClassGroupMapping[] = [];

  groupedLogicSpans.forEach((groupedLogicSpan) => {
    const allMatchingGroups = groupedLogicSpans.filter(containSpansWithClass);
    const sorted = allMatchingGroups.sort(sortSpansBySize);
    const biggest = sorted.at(-1);
    const resultContainsSpan = result.some(containSpansWithClass);

    if (!resultContainsSpan && biggest) {
      result.push(biggest);
    }
  });

  return result;
}

/**
 *
 * @param {Element} firstElement
 * @param {Element} secondElement
 *
 * @returns boolean
 */
function haveOverlappingClass(firstElement: Element, secondElement: Element): boolean {
  return [...firstElement.classList].some((clazz) => secondElement.classList.contains(clazz));
}

/**
 *
 * @param {HTMLSpanElement} spanWrapper
 * @param {Element} nested
 *
 * @returns void
 */
function removeAlreadyNestedChildNodes(spanWrapper: HTMLSpanElement, nested: Element) {
  spanWrapper.childNodes.forEach((childNode) => {
    if (childNode instanceof Element && [...nested.children].some((c) => haveOverlappingClass(c, childNode))) {
      childNode.remove();
    }
  });
}

/**
 *
 * @param {HTMLSpanElement} spanWrapper
 * @param {Element} nested
 *
 * @returns void
 */
function unwrapNodesWithSameClassAsParent(spanWrapper: HTMLSpanElement, nested: Element) {
  nested.childNodes.forEach((childNode) => {
    if (childNode instanceof Element && haveOverlappingClass(childNode, spanWrapper)) {
      const inner = String(childNode.innerHTML);
      childNode.remove();
      nested.append(inner);
    }
  });
}

/**
 * todo add reason for: removeAlreadyNestedChildNodes
 * todo add reason for: unwrapNodesWithSameClassAsParent
 *
 * @param {string} classKey
 * @param {Element[]} flatSpans
 *
 * @returns HTMLSpanElement
 */
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

      if (flatSpan.classList.length > 1) {
        // we have to nest even deeper
        if (flatSpan.parentElement) {
          const nested = nestElements(flatSpan.parentElement); //todo check for recursion deepness?
          removeAlreadyNestedChildNodes(spanWrapper, nested);
          unwrapNodesWithSameClassAsParent(spanWrapper, nested);
          spanWrapper.append(...nested.children);
        }
      } else {
        spanWrapper.append(flatSpan.cloneNode(true));
      }
    }
  });

  return spanWrapper;
}

/**
 *
 * @param {Element} node the old p node
 * @param {HTMLSpanElement[]} nestedSpans
 */
function assembleNewParagraph(node: Element, nestedSpans: HTMLSpanElement[]): Element {
  const newNode = document.createElement("p");

  // TODO do we need this?
  // const whitespaceCleanedChildren = [...node.childNodes].filter((childNode) => {
  //   const textContent = childNode.textContent?.trim();
  //   const isNotEmpty = !!textContent?.length && textContent.length > 0;
  //   return isNotEmpty;
  // });

  [...node.childNodes].forEach((child) => {
    const isTextNode = !(child instanceof Element);

    console.log(isTextNode ? child : child.outerHTML, isTextNode);

    if (isTextNode) {
      newNode.append(child.cloneNode());
    } else {
      replaceSimilarSpansWithNestedSpan(newNode, child, nestedSpans);
    }
  });
  return newNode;
}

/**
 * @param {Element} node the new created p node
 * @param {HTMLSpanElement[]} nestedSpans
 * @param {Element} child
 */
function replaceSimilarSpansWithNestedSpan(node: Element, child: Element, nestedSpans: HTMLSpanElement[]) {
  const isSpanAlreadyAdded =
      node.childNodes.length > 1 &&
      [...child.classList].every((currentClass) => {
        return !!node.querySelector(`.${currentClass}`);
      });

  if (isSpanAlreadyAdded) {
    return;
  }

  const nextNestedSpan = nestedSpans.shift();

  if (nextNestedSpan) {
    node.append(nextNestedSpan);
  }
}

/**
 *
 * @param {Element} parent old node
 *
 * @returns Element
 */
function nestElements(parent: Element) {
  const children = parent.querySelectorAll("span");
  const classGroupMappings = groupByClass([...children]); // TODO maybe just call once and not recursive

  console.log("classGroupMapping", classGroupMappings);

  const nestedSpans = classGroupMappings.map(({ classKey, spans }) => {
    const nestedSpan = nestGroupedSpans(classKey, spans);
    return nestedSpan;
  });

  const newParagraph = assembleNewParagraph(parent, nestedSpans);
  return newParagraph;
}
