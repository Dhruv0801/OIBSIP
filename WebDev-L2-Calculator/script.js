const mainDisplay = document.getElementById("mainDisplay");
const historyText = document.getElementById("historyText");
const statusText = document.getElementById("statusText");
const buttons = document.querySelectorAll(".btn");

let firstValue = "";
let secondValue = "";
let currentOperator = "";
let resultMode = false;

function updateDisplay(value) {
  mainDisplay.textContent = value;
}

function updateStatus(message) {
  statusText.textContent = message;
}

function resetAll() {
  firstValue = "";
  secondValue = "";
  currentOperator = "";
  resultMode = false;
  historyText.textContent = "MISSION READY //";
  updateDisplay("0");
  updateStatus("STANDBY");
}

function calculateValues(a, b, operator) {
  let num1 = parseFloat(a);
  let num2 = parseFloat(b);
  let result;

  switch (operator) {
    case "+":
      result = num1 + num2;
      break;
    case "-":
      result = num1 - num2;
      break;
    case "*":
      result = num1 * num2;
      break;
    case "/":
      if (num2 === 0) {
        return "ERROR";
      }
      result = num1 / num2;
      break;
    default:
      return b;
  }

  return result.toString();
}

buttons.forEach(function(button) {
  button.addEventListener("click", function() {
    let type = button.dataset.type;
    let value = button.dataset.value;

    if (type === "number") {
      updateStatus("INPUT RECEIVED");

      if (currentOperator === "") {
        if (resultMode) {
          firstValue = "";
          resultMode = false;
        }

        firstValue += value;
        updateDisplay(firstValue);
      } else {
        secondValue += value;
        updateDisplay(secondValue);
      }
    }

    else if (type === "decimal") {
      updateStatus("DECIMAL MODE");

      if (currentOperator === "") {
        if (!firstValue.includes(".")) {
          firstValue = firstValue === "" ? "0." : firstValue + ".";
          updateDisplay(firstValue);
        }
      } else {
        if (!secondValue.includes(".")) {
          secondValue = secondValue === "" ? "0." : secondValue + ".";
          updateDisplay(secondValue);
        }
      }
    }

    else if (type === "operator") {
      if (firstValue === "") return;

      if (secondValue !== "") {
        let tempResult = calculateValues(firstValue, secondValue, currentOperator);

        if (tempResult === "ERROR") {
          updateDisplay("ERROR");
          historyText.textContent = "DIVISION BY ZERO BLOCKED";
          updateStatus("CRITICAL");
          firstValue = "";
          secondValue = "";
          currentOperator = "";
          resultMode = true;
          return;
        } else {
          firstValue = tempResult;
          secondValue = "";
          updateDisplay(firstValue);
        }
      }

      currentOperator = value;
      historyText.textContent = "TARGET // " + firstValue + " " + value;
      updateStatus("OPERATOR LOCKED");
    }

    else if (type === "equal") {
      if (firstValue === "" || secondValue === "" || currentOperator === "") return;

      let finalResult = calculateValues(firstValue, secondValue, currentOperator);

      if (finalResult === "ERROR") {
        updateDisplay("ERROR");
        historyText.textContent = "DIVISION BY ZERO BLOCKED";
        updateStatus("CRITICAL");
        firstValue = "";
        secondValue = "";
        currentOperator = "";
      } else {
        historyText.textContent = "FIRE // " + firstValue + " " + currentOperator + " " + secondValue;
        updateDisplay(finalResult);
        updateStatus("RESULT CONFIRMED");
        firstValue = finalResult;
        secondValue = "";
        currentOperator = "";
        resultMode = true;
      }
    }

    else if (type === "clear") {
      resetAll();
    }

    else if (type === "delete") {
      updateStatus("LAST ENTRY REMOVED");

      if (currentOperator === "") {
        firstValue = firstValue.slice(0, -1);
        updateDisplay(firstValue === "" ? "0" : firstValue);
      } else {
        secondValue = secondValue.slice(0, -1);
        updateDisplay(secondValue === "" ? "0" : secondValue);
      }
    }
  });
});

document.addEventListener("keydown", function(event) {
  const key = event.key;

  if (!isNaN(key)) {
    document.querySelector(`[data-type="number"][data-value="${key}"]`)?.click();
  } else if (key === ".") {
    document.querySelector('[data-type="decimal"]')?.click();
  } else if (key === "+" || key === "-" || key === "*" || key === "/") {
    document.querySelector(`[data-type="operator"][data-value="${key}"]`)?.click();
  } else if (key === "Enter" || key === "=") {
    event.preventDefault();
    document.querySelector('[data-type="equal"]')?.click();
  } else if (key === "Backspace") {
    document.querySelector('[data-type="delete"]')?.click();
  } else if (key === "Escape") {
    document.querySelector('[data-type="clear"]')?.click();
  }
});

resetAll();