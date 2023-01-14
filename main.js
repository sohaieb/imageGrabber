let {argv} = require('./src/CommandArgs');
let {grabImagesByUrl} = require('./src/GrabbImages');

const url = argv.u;
const folder = argv.f;

(async () => { await grabImagesByUrl(url, folder)})();
