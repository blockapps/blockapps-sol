// QUEST: is this function is good to be here or we can move to rest ?
const fs = require('fs');
const yaml = require('js-yaml');

// read a yaml or die
function getYamlFile(yamlFilename) {
    return yaml.safeLoad(fs.readFileSync(yamlFilename, 'utf8'));
}

module.exports = {
  getYamlFile
};
