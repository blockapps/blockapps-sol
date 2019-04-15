import { getYamlFile } from './config';

let config;

if (!config) {
  config = getYamlFile('config.yaml');
}

export default config;