import { PublicUploadAudit } from "blossom-server-audit";

async function getExampleBlob(url) {
  const fileUrl = new URL("../assets/bitcoin.pdf", import.meta.url).href;
  const response = await fetch(fileUrl);
  return await response.blob();
}

function outputResult(result, parent) {
  const element = document.createElement("details");
  element.classList.add("result");

  element.classList.add(result.type);
  const summary = document.createElement("summary");
  summary.textContent = `${result.type.toUpperCase()}: ${result.summary}`;
  element.appendChild(summary);

  if (result.description) {
    const description = document.createElement("p");
    description.textContent = result.description;
    element.appendChild(description);
  }
  if (result.see) {
    const link = document.createElement("a");
    link.href = result.see;
    link.textContent = "see";
    element.appendChild(link);
  }

  parent.appendChild(element);
}

function outputAudit(audit, parent) {
  const element = document.createElement("details");
  element.classList.add("audit");
  element.open = true;

  const summary = document.createElement("summary");
  summary.textContent = audit.name;
  element.appendChild(summary);

  const results = document.createElement("div");
  element.appendChild(results);

  audit.on("result", (result) => outputResult(result, results));

  // attach to children
  audit.on("child", (child) => outputAudit(child, element));

  audit.on("error", (error) => {
    element.classList.add("error");

    const code = document.createElement("pre.error");
    code.textContent = error.message;
    element.appendChild(code);
  });
  audit.on("complete", () => {
    element.classList.add("complete");
    element.classList.add(audit.status);
  });

  parent.appendChild(element);
}

// run upload audit
document.getElementById("run").addEventListener("click", async () => {
  try {
    // clean output
    document.getElementById("output").innerHTML = "";

    const server = document.getElementById("server").value;
    if (!URL.canParse(server)) throw new Error("Invalid server URL");

    const blob = await getExampleBlob();
    const audit = new PublicUploadAudit("public upload", blob, { server });

    outputAudit(audit, document.getElementById("output"));

    await audit.run();
  } catch (error) {
    outputResult(error);
  }
});
