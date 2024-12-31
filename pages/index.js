import { fullAudit, group, hooks } from "blossom-server-audit";

async function getExampleBlob() {
  const fileUrl = new URL("../assets/bitcoin.pdf", import.meta.url).href;
  const response = await fetch(fileUrl);
  return await response.blob();
}

const elements = new Map();

function getResultElement(result) {
  if (!elements.has(result)) {
    const element = document.createElement("details");
    element.open = !!result.children;
    elements.set(result, element);

    element.className = `result ${result.type} ${!!result.children ? "group" : ""}`;

    const summary = document.createElement("summary");
    summary.className = "summary";
    summary.textContent = result.name;
    element.appendChild(summary);

    const description = document.createElement("p");
    description.className = "description";
    description.style.display = result.description ? "initial" : "none";
    if (result.description) description.textContent = result.description;
    element.appendChild(description);

    const link = document.createElement("a");
    link.className = "link";
    link.textContent = "see";
    link.setAttribute("target", "_blank");
    link.style.display = result.see ? "initial" : "none";
    if (result.see) link.href = result.see;
    element.appendChild(link);

    // append to parent
    if (result.parent) {
      const parentElement = getResultElement(result.parent);
      parentElement.appendChild(element);
    } else {
      document.getElementById("output").appendChild(element);
    }
  }

  return elements.get(result);
}

function updateResult(result) {
  const element = getResultElement(result);

  element.className = `result ${result.type} ${!!result.children ? "group" : ""}`;
  element.querySelector(".summary").textContent = result.summary;

  element.querySelector(".description").style.display = result.description ? "initial" : "none";
  element.querySelector(".link").style.display = result.see ? "initial" : "none";

  if (result.description) element.querySelector(".description").textContent = result.description;
  if (result.see) element.querySelector(".link").href = result.see;

  if (result.parent) updateResult(result.parent);
}

hooks.onResult = updateResult;

const form = document.getElementById("form");
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const values = Object.fromEntries(formData);

  // clear output
  document.getElementById("output").innerHTML = "";
  elements.clear();

  const ctx = { server: values.server };
  const blob = await getExampleBlob();

  await group(values.server, fullAudit(ctx, blob));
});
