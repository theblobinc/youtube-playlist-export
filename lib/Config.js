import Conf from "conf";

const schema = {
  apiKey: {
    type: "string",
    default: "",
  },
};

class Config {
  constructor() {
    this.conf = new Conf({ schema });
  }

  get apiKey() {
    const key = this.conf.get("apiKey");
    return key;
  }

  set apiKey(newKey) {
    this.conf.set("apiKey", newKey);
  }

  removeApiKey() {
    this.conf.delete("apiKey");
  }

  /**
   * Get the path of the config file.
   */
  get path() {
    return this.conf.path;
  }

  /**
   * Reset all items to their default value defined in `schema`.
   */
  resetAll() {
    this.conf.clear();
  }
}

export default Config;