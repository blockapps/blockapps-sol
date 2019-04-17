import { faUtil } from "blockapps-rest";

let config;

if (!config) {
  config = sUtil.getYaml(
    `config/${
      process.env.SERVER ? process.env.SERVER : "localhost"
    }.config.yaml`
  );
}

export default config;
