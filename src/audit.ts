import debug, { Debugger } from "debug";
import { EventEmitter } from "eventemitter3";

type Base = {
  /** A short one line summary of the issue */
  summary: string;
  /** A longer optional description */
  description?: string;
  /** A URL where the user can read more about the warning */
  see?: string;
};

export type Pass = Base & { type: "pass" };
export type Fail = Base & { type: "fail" };
export type Warn = Base & { type: "warn" };
export type Info = Base & { type: "info" };

export type Result = Pass | Fail | Warn | Info;

type EventMap = {
  start: [];
  error: [Error];
  complete: [Result[]];
  result: [Result];
  child: [Audit];
};

export class Audit<
  Input extends unknown = unknown,
  Config extends Record<string, any> = Record<string, any>,
> extends EventEmitter<EventMap> {
  complete = false;
  error?: Error;
  logs: string[] = [];
  results: Result[] = [];
  children: Audit[] = [];
  config: Config;

  protected log: Debugger;

  get failed() {
    return this.results.filter((r) => r.type === "fail");
  }
  get passed() {
    return this.results.filter((r) => r.type === "pass");
  }
  get warned() {
    return this.results.filter((r) => r.type === "warn");
  }
  get infos() {
    return this.results.filter((r) => r.type === "info");
  }

  get status(): "fail" | "pass" | "warn" {
    if (this.failed.length > 0 || this.children.some((c) => c.status === "fail")) return "fail";
    else if (this.warned.length > 0 || this.children.some((c) => c.status === "warn")) return "warn";
    return "pass";
  }

  constructor(
    public name: string,
    public input: Input,
    config?: Config,
    parent?: Audit,
  ) {
    super();

    // @ts-expect-error
    this.config = config || {};

    this.log = parent ? parent.log.extend(this.name) : debug(this.name);
  }

  // private helper methods
  protected pass(message: string | Omit<Pass, "type">) {
    const pass: Pass = typeof message === "string" ? { type: "pass", summary: message } : { type: "pass", ...message };

    this.results.push(pass);
    this.emit("result", pass);
  }
  protected info(message: string | Omit<Info, "type">) {
    const info: Info = typeof message === "string" ? { type: "info", summary: message } : { type: "info", ...message };

    this.results.push(info);
    this.emit("result", info);
  }
  protected fail(message: string | Omit<Fail, "type">) {
    const fail: Fail = typeof message === "string" ? { type: "fail", summary: message } : { type: "fail", ...message };

    this.results.push(fail);
    this.emit("result", fail);
  }
  protected warn(message: string | Omit<Warn, "type">) {
    const warn: Warn = typeof message === "string" ? { type: "warn", summary: message } : { type: "warn", ...message };

    this.results.push(warn);
    this.emit("result", warn);
  }

  protected async runChildAudit<I extends unknown = unknown, C extends Record<string, any> = Record<string, any>>(
    AuditClass: new (name: string, input: I, config: C) => Audit<I, C>,
    name: string,
    input: I,
    config?: C & Partial<Config>,
  ) {
    // @ts-expect-error
    const child = new AuditClass(name, input, config ? { ...this.config, ...config } : this.config, this);

    this.children.push(child);
    this.emit("child", child);

    await child.run();
  }

  /** Implementation */
  protected async audit() {
    throw new Error("Not implemented");
  }

  /** Run the audit */
  async run(input?: Input) {
    if (this.complete) throw new Error("Already complete");
    if (input !== undefined) this.input = input;

    try {
      if ("group" in console) console.group(this.name);

      this.log("Running");
      await this.audit();

      this.complete = true;
      this.emit("complete", this.results);
      this.log("Complete");

      if ("groupEnd" in console) console.groupEnd();
    } catch (error) {
      if (error instanceof Error) {
        this.error = error;
        this.emit("error", error);
        this.log(`Error ${error.message}`);
      }
    }
  }
}
