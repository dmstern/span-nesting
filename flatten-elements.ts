function uid() : number{
    return Date.now()
}


function flattenSpanElements(pElement: HTMLElement): HTMLElement {
    const processSpan = (
        span: Element,
        parentClasses: string[] = [],
        parentAttributes: Attr[] = [],
    ): HTMLSpanElement[] => {
        const result: HTMLSpanElement[] = [];
        const childNodes = span.childNodes;

        childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                // Create a new span for text nodes, inheriting parent classes
                const textSpan = document.createElement("span");
                parentAttributes.forEach((attr) => {
                    if (attr.nodeName !== "class") {
                        textSpan.setAttribute(attr.nodeName, attr.nodeValue || "");
                    }
                });
                textSpan.classList.add(...parentClasses);
                textSpan.textContent = node.textContent || "";
                result.push(textSpan);
            } else if (node instanceof HTMLSpanElement) {
                const childSpan = node as HTMLSpanElement;
                const combinedClasses = [...parentClasses, ...[...childSpan.classList].map((cls) => `${cls}_${uid()}`)];
                const combinedAttributes = [...parentAttributes, ...childSpan.attributes];
                result.push(...processSpan(childSpan, combinedClasses, combinedAttributes));
            } else if (node instanceof HTMLElement) {
                result.push(node);
            } else {
                console.error("¯\\_(ツ)_/¯");
            }
        });

        return result;
    };

    const childNodes = pElement.childNodes;
    const newChildNodes: Node[] = [];

    childNodes.forEach((node) => {
        if (node instanceof HTMLSpanElement) {
            newChildNodes.push(
                ...processSpan(
                    node,
                    Array.from(node.classList).map((cls) => `${cls}_${uid()}`),
                    Array.from(node.attributes),
                ),
            );
        } else {
            newChildNodes.push(node);
        }
    });

    // Replace the <p> element's content with the newly split spans
    pElement.innerHTML = "";
    newChildNodes.forEach((newSpan) => pElement.appendChild(newSpan));
    return pElement;
}