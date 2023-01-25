import yargs from 'yargs/yargs';

/** t445t comment
* test comment
*/     
const argv = yargs(process.argv.slice(2))
    .usage('Usage: $0 -u https://example.com [options]')
    .alias('u', 'url')
    .describe('u', 'Load url to be grabbed')
    .alias('f', 'folder')
    .describe('f', 'folder name to download images in')
    .default('f', 'images')
    .alias('m', 'max')
    .describe('m', 'Max images count to download')
    .default('m', '150')
    .demandOption(['u', 'f', 'm'])
    .help('h')
    .alias('h', 'help')
    .argv;

export {argv};