const puppeteer = require('puppeteer');
const fs = require('fs');
const axios = require('axios');
const ora = require('ora');
const cliSpinners = require('cli-spinners');
const chalk = require('chalk');

module.exports.grabImagesByUrl = async (url, folder) => {
    const spinner = ora({spinner: cliSpinners.circleQuarters, color: 'green'}).start();
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    await extractImagesProcess(page, folder);
    await browser.close();
    spinner.stop();
}

async function extractImagesProcess(page, folder) {
    let results = await page.$$eval("[href],[src]", results => results.map(res => res.href || res.src));
    results = results.filter(imgUrl => /.*\.(jpg|png|svg|gif)(.*)$/.test(imgUrl));
    const imagesPromises = [];
    let i = 0;
    for (const res of results) {
        const response = await axios.get(res);
        const contentType = response.headers['content-type'];
        if (isImage(contentType) && getExtensionFromMime(contentType)) {
            i++;
            imagesPromises.push({
                promise: axios({url: res, method: "get", responseType: "stream"}),
                extension: getExtensionFromMime(contentType)
            });
        }
    }

    const streams = await Promise.all(imagesPromises.map(imgProm => imgProm.promise));
    streams.forEach((stream, i) => {
        const ws = getStreams(`${folder}/image-${i}${imagesPromises[i].extension}`);
        stream.data.pipe(ws);
    });
}


function getStreams(fileName) {
    return fs.createWriteStream(fileName, {encoding: 'base64'});
}

function isImage(contentType) {
    return contentType.includes('image/');
}

function getExtensionFromMime(mimeType) {
    switch (mimeType) {
        case "image/svg+xml": {
            return '.svg'
        }
        case "image/gif" : {
            return ".gif";
        }
        case "image/png": {
            return ".png";
        }

        case "image/jpeg": {
            return ".jpg"
        }

        case "image/vnd.microsoft.icon": {
            return ".ico"
        }

        case "image/tiff": {
            return ".tiff";
        }

        case "image/webp": {
            return ".webp";
        }

        default: {
            return false;
        }
    }
}