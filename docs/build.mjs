import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import handlebars from "handlebars";
import * as helpers from "./helpers.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

for (const [name, helper] of Object.entries(helpers)) {
  handlebars.registerHelper(name, helper);
}

for (const file of readdirSync(__dirname)) {
  if (file.endsWith(".hbs")) {
    handlebars.registerPartial(
      basename(file, ".hbs"),
      readFileSync(join(__dirname, file), "utf8")
    );
  }
}

// console.info(Object.entries(ts.SyntaxKind).filter(([, v]) => v === 303));
function extractNode(node) {
  if (node.kind === ts.SyntaxKind.PropertyAssignment) {
    return {
      property: node.name.text,
      value: node.initializer.text,
      tags: Object.assign(
        ...node.jsDoc.flatMap(({ tags }) =>
          tags.map((tag) => ({
            [tag.tagName.text]: tag.comment,
          }))
        )
      ),
    };
  }

  throw new Error(`Unexpected kind "${node.kind}"`);
}

function searchJsDocs(node) {
  const jsdocs = node.jsDoc ? [extractNode(node)] : [];
  ts.forEachChild(node, (child) => {
    jsdocs.push(...searchJsDocs(child));
  });
  return jsdocs;
}

async function build() {
  const program = ts.createProgram(["./lib/index.js"], { allowJs: true });
  const sourceFiles = program
    .getSourceFiles()
    .filter((file) => !file.isDeclarationFile);

  const jsdocs = [];
  for (const sourceFile of sourceFiles) {
    jsdocs.push(...searchJsDocs(sourceFile));
  }

  const template = handlebars.compile(
    readFileSync(join(__dirname, "./API.md.hbs"), "utf-8")
  );
  const docs = template({ jsdocs });
  writeFileSync(join(__dirname, "../API.md"), docs);
}

build();
