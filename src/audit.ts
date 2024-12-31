type Base = {
  /** A short one line summary of the issue */
  summary: string;
  /** A longer optional description */
  description?: string;
  /** A URL where the user can read more about the warning */
  see?: string;

  /** Other results that where checked as part of this group */
  children?: Result[];
  /** The parent group */
  parent?: Result;
};

export type Pass = Base & { type: "pass" };
export type Fail = Base & { type: "fail" };
export type Warn = Base & { type: "warn" };
export type Info = Base & { type: "info" };

export type Result = Pass | Fail | Warn | Info;
export type ResultInit = Omit<Base, "parent" | "children">;

// helpers
export function pass(message: string | ResultInit, children?: Result[]): Pass {
  return typeof message === "string"
    ? { type: "pass", summary: message, children }
    : { type: "pass", ...message, children };
}
export function info(message: string | ResultInit, children?: Result[]): Info {
  return typeof message === "string"
    ? { type: "info", summary: message, children }
    : { type: "info", ...message, children };
}
export function fail(message: string | ResultInit, children?: Result[]): Fail {
  return typeof message === "string"
    ? { type: "fail", summary: message, children }
    : { type: "fail", ...message, children };
}
export function warn(message: string | ResultInit, children?: Result[]): Warn {
  return typeof message === "string"
    ? { type: "warn", summary: message, children }
    : { type: "warn", ...message, children };
}

export const hooks = {
  onGroupStart: (_group: Result) => {},
  onGroupEnd: (_group: Result) => {},
  onResult: (_result: Result) => {},
};

let groupStack: Result[] = [];
export async function group(
  name: string,
  generators: AsyncGenerator<Result, void, any> | AsyncGenerator<Result, void, any>[],
  successResult?: string | ResultInit,
  failureResult?: string | ResultInit,
): Promise<Result> {
  generators = Array.isArray(generators) ? generators : [generators];
  const children: Result[] = [];
  const group = { type: "info", summary: name, children } as Result;

  if (groupStack.length > 0) group.parent = groupStack[groupStack.length - 1];
  groupStack.push(group);

  console.group(name);
  hooks.onGroupStart(group);

  try {
    for (const generator of generators) {
      for await (const result of generator) {
        // add result to this group
        children.push(result);
        result.parent = group;

        switch (result.type) {
          case "pass":
            console.log("✅ " + [result.summary, result.description, result.see].filter(Boolean).join("\n"));
            break;
          case "fail":
            console.log("❌ " + [result.summary, result.description, result.see].filter(Boolean).join("\n"));
            break;
          case "warn":
            console.log("🟠 " + [result.summary, result.description, result.see].filter(Boolean).join("\n"));
            break;
          case "info":
            console.log("🔵 " + [result.summary, result.description, result.see].filter(Boolean).join("\n"));
            break;
        }

        hooks.onResult(result);
      }
    }

    // set result type based on children results
    if (children.some((r) => r.type === "fail")) {
      const overwrite = failureResult || successResult;
      if (overwrite) Object.assign(group, fail(overwrite, children));
      else group.type = "fail";
    } else if (children.some((r) => r.type === "warn")) {
      if (successResult) Object.assign(group, warn(successResult));
      else group.type = "warn";
    } else {
      if (successResult) Object.assign(group, successResult);
      else group.type = "pass";
    }
  } catch (error) {
    if (error instanceof Error) {
      group.type = "fail";
      group.description = error.message;
    }
  }

  groupStack.pop();

  console.groupEnd();
  hooks.onGroupEnd(group);
  return group;
}
