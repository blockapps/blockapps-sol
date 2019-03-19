const fs = require('fs');
const yaml = require('js-yaml');

// read a yaml or die
function getYamlFile(yamlFilename) {
    return yaml.safeLoad(fs.readFileSync(yamlFilename, 'utf8'));
}

module.exports = {
  getYamlFile
};
