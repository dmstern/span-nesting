//@ts-check

function sortSpansBySize(a, b) {
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
function groupByClass(spans) {
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

/**
 * cleanup: avoid grouping spans that are already children of other groupings
 * @param { {classKey: string; spans: Element[]}[] } groupedLogicSpans
 */
function cleanupGroupings(groupedLogicSpans) {
  const result = [];

  groupedLogicSpans.forEach(({ classKey }) => {
    const containSpansWithClass = ({ spans }) =>
      spans.some((span) => span.classList.contains(classKey));

    const allMatchingGroups = groupedLogicSpans.filter(containSpansWithClass);
    const sorted = allMatchingGroups.sort(sortSpansBySize);
    const biggest = sorted.at(-1);
    const resultContainsSpan = result.some(containSpansWithClass);

    if (!resultContainsSpan) {
      result.push(biggest);
    }
  });

  

  return result;
}

/**
 *
 * @param {string} classKey
 * @param {Element[]} flatSpans
 *
 * @returns HTMLSpanElement
 */
function nestGroupedSpans(classKey, flatSpans) {
  const spanWrapper = document.createElement("span");
  spanWrapper.classList.add(classKey);

  console.log(flatSpans.map((span) => span.outerHTML));

  flatSpans.forEach((flatSpan) => {
    const hasOnlyClassKeyClass =
      flatSpan.classList.length === 1 && flatSpan.classList.contains(classKey);

    if (hasOnlyClassKeyClass) {
      const textNode = document.createTextNode(flatSpan.innerHTML);
      spanWrapper.append(textNode);
    } else {
      flatSpan.classList.remove(classKey);

      if (flatSpan.classList.length > 1) {
        // we have to nest even deeper
        if (flatSpan.parentElement) {
          const nested = nestElements(flatSpan.parentElement);
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
function assembleNewParagraph(node, nestedSpans) {
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

  console.log("RESULT:", newNode.outerHTML);

  return newNode;
}

/**
 * @param {Element} node the new created p node
 * @param {HTMLSpanElement[]} nestedSpans
 * @param {Element} child
 */
function replaceSimilarSpansWithNestedSpan(node, child, nestedSpans) {
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
function nestElements(parent) {
  const children = parent.querySelectorAll("span");
  const classGroupMappings = groupByClass([...children]); // TODO maybe just call once and not recursive

  console.log("classGroupMapping", classGroupMappings);

  const nestedSpans = classGroupMappings.map(({ classKey, spans }) => {
    const nestedSpan = nestGroupedSpans(classKey, spans);
    return nestedSpan;
  });

  console.log("parent", parent.outerHTML);

  console.log(
    "nestedSpans",
    nestedSpans.map((span) => span.outerHTML)
  );

  const newParagraph = assembleNewParagraph(parent, nestedSpans);
  return newParagraph;

  // TODO: handle deeper nestings like languages
}

const paragraphs = document.querySelectorAll("p");
paragraphs.forEach((p) => {
  const newParagraph = nestElements(p);
  p.replaceWith(newParagraph);
});
