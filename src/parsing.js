import { tokenize } from "excel-formula-tokenizer";
import { buildTree, visit } from "excel-formula-ast";

export function getCells(formula) {
  const cells = [];
  if (!formula) {
    return cells;
  }
  let tree;
  try {
    const tokens = tokenize(formula);
    tree = buildTree(tokens);
  } catch (error) {
    return cells;
  }
  visit(tree, {
    enterCell: cell => {
      cells.push(cell);
    }
  });
  return cells;
}
