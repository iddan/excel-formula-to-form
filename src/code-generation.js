import ShortUniqueId from "short-unique-id";
import { toJavaScript } from "excel-formula";

const uid = new ShortUniqueId();

export function generateForm(variables, formulas, fontSize) {
  const id = uid.randomUUID(8);
  return `
<style>
  body {
    font-family: sans-serif;
    font-size: ${fontSize}px;
  }
  input { font: inherit; }
</style>
<div id="${id}">
${Object.entries(variables)
  .sort()
  .map(
    ([key, { name, type, abbreviation }]) => `  <div>
    ${name}: <input id="${id}-${key}" type="${type}" /> ${abbreviation}
  </div>`
  )
  .join("\n")}
</div>
<div>
  ${Object.entries(formulas)
    .map(([key, { name, description, abbreviation }]) => {
      return `
<div>
  <p>
    <div><strong>${name}:</strong> <span id="${id}-result-${key}"></span> ${
        abbreviation ? abbreviation : ""
      }</div>
    ${description ? description : ""}
  </p>
</div>
`;
    })
    .join("\n")}
</div>
<script>
// This code is wrapped to prevent unwanted global names
(function () {
${Object.keys(variables)
  .map(key => `  var ${key} = "";`)
  .join("\n")}

  function update() {
    with(formulajs) {
${Object.entries(formulas)
  .map(([key, { formula }]) => {
    try {
      return `      document.getElementById("${id}-result-${key}").innerText = ${toJavaScript(
        formula
      )};`;
    } catch (error) {
      return "";
    }
  })
  .join("\n")}
    }
  }

  ${Object.entries(variables)
    .map(([key, { type }]) => {
      return `
  document.getElementById("${id}-${key}").addEventListener("keyup", function (event) {
    ${
      type === "number"
        ? `${key} = Number(event.target.value);`
        : `${key} = event.target.value`
    }
    update();
  });`;
    })
    .join("\n")}
})();
</script>
<script src="https://cdn.jsdelivr.net/npm/jstat@1.9.2/dist/jstat.min.js"></script> 
<script src="https://cdn.jsdelivr.net/gh/formulajs/formulajs@2.3.0/dist/formula.min.js"></script>
  `;
}

export function wrapElements(html) {
  return `
  <html>
  <body>
  ${html}
  </body>
  </html>
  `;
}
