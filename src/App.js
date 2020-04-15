import React, { useState, useCallback, useEffect, useMemo } from "react";
import Modal from "react-modal";
import ShortUniqueId from "short-unique-id";
import { generateForm, wrapElements } from "./code-generation";
import { getCells } from "./parsing";
import "./styles.css";

const uid = new ShortUniqueId();
const SUMMATION_FORMULA = "=SUM(A1, A2)";

function newFormulaID() {
  return uid.randomUUID(8);
}

const DEFAULT_FORMULAS = {
  [newFormulaID()]: {
    name: "Summation",
    formula: SUMMATION_FORMULA,
    description: "The addition of a sequence of any kind of numbers"
  },
  [newFormulaID()]: {
    name: "Multipication",
    formula: "=A1 * A2",
    description: "Equivalent to adding as many copies of one of them"
  }
};

export default function App() {
  const [formulas, setFormulas] = useState(DEFAULT_FORMULAS);
  const [variables, setVariables] = useState({});
  const [recoverModalOpen, setRecoverModalOpen] = useState(false);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState("16");
  const cells = Object.values(formulas).flatMap(({ formula }) =>
    getCells(formula)
  );
  const html = generateForm(variables, formulas, fontSize);
  const updateFormula = useCallback(
    (key, update) => {
      setFormulas(formulas => ({
        ...formulas,
        [key]: {
          ...formulas[key],
          ...update
        }
      }));
    },
    [setFormulas]
  );
  const addFormula = useCallback(() => {
    setFormulas(formulas => ({
      ...formulas,
      [newFormulaID()]: {
        name: "Name",
        formula: "="
      }
    }));
  }, [setFormulas]);
  const removeFormula = useCallback(
    key => {
      setFormulas(({ [key]: _, ...rest }) => rest);
    },
    [setFormulas]
  );
  const updateVariable = useCallback(
    (key, update) => {
      setVariables({
        ...variables,
        [key]: {
          ...variables[key],
          ...update
        }
      });
    },
    [variables, setVariables]
  );
  const addVariable = useCallback(
    key => {
      setVariables({
        ...variables,
        [key]: {
          name: key,
          type: "number",
          abbreviation: ""
        }
      });
    },
    [setVariables, variables]
  );
  const deleteVariable = useCallback(
    varKey => {
      setVariables(({ [varKey]: _, ...rest }) => rest);
    },
    [setVariables]
  );
  const openRecoverModal = useCallback(() => {
    setRecoverModalOpen(true);
  }, [setRecoverModalOpen]);

  const closeRecoverModal = useCallback(() => {
    setRecoverModalOpen(false);
  }, [setRecoverModalOpen]);

  const openBackupModal = useCallback(() => {
    setBackupModalOpen(true);
  }, [setBackupModalOpen]);

  const closeBackupModal = useCallback(() => {
    setBackupModalOpen(false);
  }, [setBackupModalOpen]);

  const recover = useCallback(
    ({ formulas, variables }) => {
      setVariables(variables);
      setFormulas(formulas);
    },
    [setVariables, setFormulas]
  );

  useEffect(() => {
    const keys = new Set();
    for (const cell of cells) {
      keys.add(cell.key);
      if (!(cell.key in variables)) {
        addVariable(cell.key);
      }
    }
    for (const varKey in variables) {
      if (!keys.has(varKey)) {
        deleteVariable(varKey);
      }
    }
  }, [cells, addVariable, deleteVariable, variables]);

  const handleFontSize = useCallback(
    event => {
      setFontSize(event.target.value);
    },
    [setFontSize]
  );

  return (
    <div className="App">
      <RecoverModal
        isOpen={recoverModalOpen}
        onRequestClose={closeRecoverModal}
        onSubmit={recover}
      />
      <BackupModal
        isOpen={backupModalOpen}
        onRequestClose={closeBackupModal}
        formulas={formulas}
        variables={variables}
      />
      <h1>Excel Formula To HTML Form</h1>
      <button onClick={openBackupModal}>Backup</button>{" "}
      <button onClick={openRecoverModal}>Recover</button>
      <h3>Formula</h3>
      <p>
        Input an Excel formula (for example: <code>{SUMMATION_FORMULA}</code>)
      </p>
      {Object.entries(formulas).map(
        ([key, { name, formula, abbreviation, description }]) => {
          return (
            <div key={key}>
              <p>
                <label>Title</label>
                <input
                  type="text"
                  value={name}
                  onChange={event => {
                    updateFormula(key, { name: event.target.value });
                  }}
                />
              </p>
              <p>
                <label>Formula</label>
                <input
                  type="text"
                  value={formula}
                  onChange={event => {
                    updateFormula(key, { formula: event.target.value });
                  }}
                />
              </p>
              <p>
                <label>Abbreviation</label>
                <input
                  type="text"
                  value={abbreviation}
                  onChange={event => {
                    updateFormula(key, { abbreviation: event.target.value });
                  }}
                />
              </p>
              <p>
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={event => {
                    updateFormula(key, { description: event.target.value });
                  }}
                />
              </p>
              <button onClick={() => removeFormula(key)}>Delete</button>
            </div>
          );
        }
      )}
      <button onClick={addFormula}>Add formula</button>
      <h3>Cells</h3>
      <p>
        For each Excel cell referenced in the formula give a name to be
        displayed in the form
      </p>
      <div>
        <div className="cells-title">
          <span>Cell</span>
          <span>Name</span>
          <span>Type</span>
          <span>Abbreviation</span>
        </div>
        {Object.entries(variables)
          .sort()
          .map(([key, { name, type }]) => {
            return (
              <div key={key}>
                <label>{key}</label>
                <input
                  type="text"
                  value={name}
                  onChange={event => {
                    const { value } = event.target;
                    updateVariable(key, { name: value });
                  }}
                />
                <select
                  value={type}
                  onChange={event => {
                    const { value } = event.target;
                    updateVariable(key, { type: value });
                  }}
                >
                  <option value="number">Number</option>
                  <option value="text">Text</option>
                </select>
                <input
                  type="text"
                  onChange={event => {
                    const { value } = event.target;
                    updateVariable(key, { abbreviation: value });
                  }}
                />
              </div>
            );
          })}
      </div>
      <h3>Style</h3>
      Font Size:{" "}
      <input type="number" value={fontSize} onChange={handleFontSize} />
      pixels
      <h3>Generated Form</h3>
      <iframe title="Generated form" src={htmlToSrc(wrapElements(html))} />
      <h3>Generated Form HTML Code</h3>
      <pre>
        <code>{html}</code>
      </pre>
    </div>
  );
}

function htmlToSrc(html) {
  return "data:text/html;charset=utf-8," + encodeURI(html);
}

const RecoverModal = ({ isOpen, onRequestClose, onSubmit }) => {
  const handleSubmit = useCallback(
    event => {
      event.preventDefault();
      let json;
      const { value } = event.target.elements["json"];
      try {
        json = JSON.parse(value);
      } catch (error) {
        alert("Invalid JSON");
        return;
      }
      if (
        !(typeof json.formulas === "object") ||
        !(typeof json.variables === "object")
      ) {
        alert("Invalid JSON");
        return;
      }
      onSubmit(json);
      onRequestClose();
    },
    [onSubmit, onRequestClose]
  );
  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose}>
      <h2>Recover</h2>
      <p>Paste a JSON copied from the JSON code block to recover the form</p>
      <form className="recover" onSubmit={handleSubmit}>
        <textarea name="json" placeholder="Paste JSON here" />
        <button>Recover</button>
      </form>
    </Modal>
  );
};

const BackupModal = ({ formulas, variables, isOpen, onRequestClose }) => {
  const json = useMemo(() => {
    return JSON.stringify(
      {
        formulas,
        variables
      },
      null,
      4
    );
  }, [formulas, variables]);

  const copyJSON = useCallback(() => {
    window.navigator.clipboard.writeText(json);
    onRequestClose();
  }, [json, onRequestClose]);
  return (
    <Modal isOpen={isOpen} onRequestClose={onRequestClose}>
      <h3>Backup</h3>
      <p>Copy the JSON text for recovering the form if needed</p>
      <button onClick={copyJSON}>Copy</button>
      <pre>
        <code>{json}</code>
      </pre>
    </Modal>
  );
};
