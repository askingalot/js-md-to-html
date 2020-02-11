function setupEventListener() {
  const goButton = document.getElementById("go");

  goButton.addEventListener("click", evt => {
    evt.preventDefault();
    const input = document.getElementById("input");
    const output = document.getElementById("output");

    fetch(input.value)
      .then(resp => resp.text())
      .then(mdText => {
        output.innerHTML = converter.convertToHtml(mdText);
      });
  });
}

const converter = {
  state: "normal",
  convertToHtml(mdText) {
    const lines = mdText.split("\n");
    const linesAsHtml = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lookAhead = (lines[i + 1] || "").trim();
      linesAsHtml.push(this.convertLine(line, lookAhead));
    }
    return linesAsHtml.join("");
  },
  convertLine(line, lookAhead) {
    // This will create paragraphs, unordered lists, ordered lists,
    //  headers and code blocks
    const partiallyConvertedLine = this[this.state](line, lookAhead);

    // Since "code" blocks should display literal text we don't want to
    //  run any other conversions on them.
    if (this.state === "code") {
      return partiallyConvertedLine;
    }

    // These conversions should happen in all "text blocks" except "code" blocks
    //  NOTE: The order of these calls matter.
    return convertLink(
           convertImage(
           convertItalics(
           convertBold(partiallyConvertedLine))));
  },
  normal(line, lookAhead) {
    if (isHeader(line)) {
      const pounds = line.match(/^(#+)/)[0];
      const hSize = pounds.length;
      return `<h${hSize}>${line.slice(hSize)}</h${hSize}>`;
    } else if (isCodeIndicator(line)) {
      this.state = "code";
      return `<pre>${line.slice(3)}`;
    } else if (isBulletedListItem(line)) {
      this.state = "bulletedList";
      return `<ul><li>${line.slice(1)}</li>`;
    } else if (isOrderedListItem(line)) {
      this.state = "orderedList";
      return `<ol><li>${line.slice(2)}</li>`;
    } else if (isBlank(line) && isText(lookAhead)) {
      this.state = "paragraph";
    }
    return line;
  },
  code(line, _lookAhead) {
    if (isCodeIndicator(line)) {
      this.state = "normal";
      return "</pre>"
    }
    return line + "\n";
  },
  bulletedList(line, lookAhead) {
    let result = `<li>${line.slice(1)}</li>`;
    if (!isBulletedListItem(lookAhead)) {
      this.state = "normal";
      result += "</ul>";
    }
    return result;
  },
  orderedList(line, lookAhead) {
    let result = `<li>${line.slice(2)}</li>`;
    if (!isOrderedListItem(lookAhead)) {
      this.state = "normal";
      result += "</ol>";
    }
    return result;
  },
  paragraph(line, lookAhead) {
    if (!isBlank(line)) {
      return line;
    }
    if (isText(lookAhead)) {
      return "</p><p>";
    }
    this.state = "normal";
    return "</p>";
  }
}

const isHeader = line => line.startsWith("#");
const isCodeIndicator = line => line.startsWith("```");
const isBulletedListItem = line => line.startsWith("*");
const isOrderedListItem = line => line.match(/^\d+\./);
const isBlank = line => line.length === 0;
const isText = line =>
  ![isHeader, isCodeIndicator, isBulletedListItem, isOrderedListItem, isBlank]
    .some(test => test(line));

const convertBold = line => 
  line.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
const convertItalics = line =>
  line.replace(/\*([^*]+)\*/g, "<i>$1</i>")
      .replace(/_([^_]+)_/g, "<i>$1</i>");
const convertImage = line => 
  line.replace(/!\[([^\]]+)\]\(([^\)]+)\)/g, "<img alt='$1' src='$2'/>");
const convertLink = line => 
  line.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, "<a href='$2'>$1</a>");


// Start everything up...
setupEventListener();