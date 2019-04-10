// QUEST: is this function is good to be here or we can move to rest ?
import fs from 'fs';
import yaml from 'js-yaml';

// read a yaml or die
function getYamlFile(yamlFilename) {
  return yaml.safeLoad(fs.readFileSync(yamlFilename, 'utf8'));
}

export {
  getYamlFile
};
