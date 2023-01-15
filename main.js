import {argv} from "./src/CommandArgs.js";
import {grabImagesByUrl} from './src/GrabbImages.js';

const url = argv.u;
const folder = argv.f;
const max = argv.m;

(async () => { await grabImagesByUrl(url, folder, max)})();
