const { writeFile } = require('fs').promises;
const { resolve } = require('path');

class WriteToFile {
  /**
   * @param {object} data Any js object that can be stringified
   * @param {string} path Path relative to project root. Don't use preceding ./
   */
  constructor(data, path) {
    if (!data) throw new Error('data required for writeToFile module');
    if (!path) throw new Error('path required for writeToFile module');
    
    this.data = JSON.stringify(data, null, 2);
    this.path = resolve(__dirname, '../../', path);

    this.writeTheFile();
  }

  async writeTheFile() {
    console.log('writing file...');
    try {
      await writeFile(this.path, this.data);
      console.log('file write successful!');
    } catch (error) {
      console.error(`file write failed with: ${error}`);
    }
  }
}

module.exports = (data, path) => new WriteToFile(data, path);
