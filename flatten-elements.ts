function uid() : number{
    return Date.now()
}
function appendUid(stringList: string[]): string[] {
    return stringList.map((listeEntry) => `${listeEntry}_${uid()}`);
}

function createSpan(textContent: string | null, classes: string[] = [], attributes: Attr[] = []) {
    const textSpan = document.createElement("span");
    attributes.forEach((attr) => {
        if (attr.nodeName !== "class") {
            textSpan.setAttribute(attr.nodeName, attr.nodeValue || "");
        }
    });
    textSpan.classList.add(...classes);
    textSpan.textContent = textContent || "";
    return textSpan;
}

function flattenSingleElement(
    span: Element,
    parentClasses: string[] = [],
    parentAttributes: Attr[] = [],
): HTMLSpanElement[] {
    const result: HTMLSpanElement[] = [];
    const childNodes = span.childNodes;

    childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const textSpan = createSpan(node.textContent, parentClasses, parentAttributes);
            result.push(textSpan);
        } else if (node instanceof HTMLSpanElement) {
            const childSpan = node as HTMLSpanElement;
            const combinedClasses = [...parentClasses, ...appendUid([...node.classList])];
            const combinedAttributes = [...parentAttributes, ...childSpan.attributes];
            result.push(...flattenSingleElement(childSpan, combinedClasses, combinedAttributes));
        } else if (node instanceof HTMLElement) {
            result.push(node); // Backup case, which should not occur
        } else {
            console.error("This state should not occur!");
        }
    });

    return result;
}

function flattenElements(pElement: HTMLElement): HTMLElement {
    const childNodes = pElement.childNodes;
    const newChildNodes: Node[] = [];

    childNodes.forEach((node) => {
        if (node instanceof HTMLSpanElement) {
            newChildNodes.push(...flattenSingleElement(node, appendUid([...node.classList]), [...node.attributes]));
        } else {
            newChildNodes.push(node);
        }
    });

    pElement.innerHTML = "";
    newChildNodes.forEach((newSpan) => pElement.appendChild(newSpan));
    return pElement;
}


const flattenButton = document.getElementById("flatten-button")

flattenButton.addEventListener("click", () =>{
    const paragraphs = document.querySelectorAll("p");
    paragraphs.forEach((p) => {
        const newParagraph = flattenElements(p);
        p.replaceWith(newParagraph);
    })
})
