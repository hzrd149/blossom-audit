import { Audit } from "../audit";

export class BlobDescriptorAudit extends Audit<Record<string, any>> {
  protected async audit() {
    const blob = this.input;

    // check url
    if (Reflect.has(blob, "url")) {
      // has url

      if (typeof Reflect.get(blob, "url") !== "string") this.fail('"url" is not a string');
      else {
        this.pass('"url" is a string');

        if (!URL.canParse(Reflect.get(blob, "url"))) this.fail(`"url" field is not a valid url`);
        else {
          this.pass(`"url" is a valid URL`);

          const url = new URL(blob.url);

          const ext = url.pathname.split(".").pop();
          if (ext) this.pass('"url" has file extension');
          else this.warn(`"url" missing file extension`);
        }
      }
    } else this.fail('Missing "url" field');

    // check size
    if (!Reflect.has(blob, "size")) this.fail('Missing "size" field');
    else if (typeof Reflect.get(blob, "size") !== "number") this.fail(`"size" is not a number`);

    // check type
    if (!Reflect.has(blob, "type")) this.warn(`Missing "type" field`);

    // check uploaded
    if (!Reflect.has(blob, "uploaded")) this.fail('Missing "uploaded" field');
    else if (typeof Reflect.get(blob, "uploaded") !== "number") this.fail(`"uploaded" is not a number`);

    // check legacy fields
    if (Reflect.has(blob, "created_at")) {
      this.warn({
        summary: `Has legacy "created_at" field`,
        description: `The created_at field should be renamed to uploaded`,
      });
    }

    // check for any unknown fields
    const knownFields = ["url", "size", "sha256", "type", "uploaded"];
    for (const field of Reflect.ownKeys(blob)) {
      if (typeof field === "string" && !knownFields.includes(field)) {
        const value = Reflect.get(blob, field);

        if (value !== undefined) {
          this.info({
            summary: `Has unknown "${field}" field`,
            description: `Field: ${field}\nType: ${typeof value}\nValue: ${value}`,
          });
        }
      }
    }
  }
}
