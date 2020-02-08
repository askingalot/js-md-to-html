const isHeader = line => line.startsWith("#");
const isCodeIndicator = line => line.startsWith("```");
const isBulletedListItem = line => line.startsWith("*");
const isBlank = line => line.length === 0;

const isText = line =>
  ![isHeader, isCodeIndicator, isBulletedListItem, isBlank].some(test => test(line));

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
    return this[this.state](line, lookAhead);
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

setupEventListener();