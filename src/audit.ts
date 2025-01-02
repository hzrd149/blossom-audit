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
export type Err = Base & { type: "error" };

export type Result = Pass | Fail | Warn | Info | Err;
export type ResultInit = Omit<Base, "parent" | "children">;

export const hooks = {
  onGroupStart: (_group: Result) => {},
  onGroupEnd: (_group: Result) => {},
  onGroup: (_group: Result) => {},
  onResult: (_result: Result) => {},
};
let stack: Result[] = [];

// helpers to add items to context
export function item(
  type: "pass" | "fail" | "info" | "warn" | "error",
  message: string | ResultInit,
  children?: Result[],
) {
  const parent = stack[stack.length - 1];
  if (!parent) throw new Error("Cant add an item without a parent group");

  const item: Result =
    typeof message === "string" ? { type: type, summary: message, children } : { type: type, ...message, children };

  item.parent = parent;
  if (!parent.children) parent.children = [];
  parent.children.push(item);

  hooks.onResult(item);

  return item;
}
export function pass(message: string | ResultInit, children?: Result[]): Pass {
  return item("pass", message, children) as Pass;
}
export function info(message: string | ResultInit, children?: Result[]): Info {
  return item("info", message, children) as Info;
}
export function fail(message: string | ResultInit, children?: Result[]): Fail {
  return item("fail", message, children) as Fail;
}
export function warn(message: string | ResultInit, children?: Result[]): Warn {
  return item("warn", message, children) as Warn;
}
export function err(message: string | ResultInit, children?: Result[]): Err {
  return item("error", message, children) as Err;
}

// start a new audit group
export async function* group<T>(
  name: string,
  generator: AsyncGenerator<Result, T, any>,
  successResult?: string | ResultInit,
  failureResult?: string | ResultInit,
): AsyncGenerator<Result, T | undefined, any> {
  const children: Result[] = [];
  const group = { type: "info", summary: name, children } as Result;

  if (stack.length > 0) {
    const parent = stack[stack.length - 1];
    group.parent = parent;
    if (!parent.children) parent.children = [];
    parent.children.push(group);
  }
  stack.push(group);

  hooks.onGroup(group);

  hooks.onGroupStart(group);

  let result: IteratorResult<Result, T>;
  try {
    while (!(result = await generator.next()).done) {
      if (!result.done) {
        const item = result.value;

        // add result to this group
        if (!item.parent) {
          children.push(item);
          item.parent = group;

          hooks.onResult(item);
        }
      }
    }

    // set result type based on children results
    if (children.some((r) => r.type === "fail" || r.type === "error")) {
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

    stack.pop();
    hooks.onGroupEnd(group);

    yield group;

    // result the result
    return result.value;
  } catch (error) {
    if (error instanceof Error) {
      const item: Err = { type: "error", summary: error.message, description: error.stack, parent: group };
      children.push(item);
      hooks.onResult(item);

      group.type = "fail";
    }

    stack.pop();
    hooks.onGroupEnd(group);

    yield group;

    return;
  }
}

export async function audit(generators: AsyncGenerator<Result, any, any> | AsyncGenerator<Result, any, any>[]) {
  if (!Array.isArray(generators)) generators = [generators];

  const results: Result[] = [];
  for (const generator of generators) {
    for await (const item of generator) {
      results.push(item);
    }
  }

  return results;
}
