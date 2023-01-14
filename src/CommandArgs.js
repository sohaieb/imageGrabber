module.exports.argv = require('yargs/yargs')(process.argv.slice(2))
    .usage('Usage: $0 -u https://example.com')
    .alias('u', 'url')
    .describe('u', 'Load url to be grabbed')
    .demandOption(['u'])
    .alias('f', 'folder')
    .describe('f', 'folder name to download images in')
    .default('f', 'images')
    .demandOption(['u', 'f'])
    .help('h')
    .alias('h', 'help')
    .argv;