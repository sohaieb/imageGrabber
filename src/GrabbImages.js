import puppeteer from "puppeteer";
import fs from 'fs';
import axios from "axios";
import ora from "ora";
import cliSpinners from "cli-spinners";
import chalk from "chalk";
import moment from "moment";


function processPageRessources(page, folder) {
    const finalUrlsToDownload = [];
    const tempUrls = [];

    page.on('response', async event => {
        if (!(event.status() >= 300 && event.status() < 400)) {
            await extractImagesProcess(event.url(), tempUrls);
        }
    });

    page.on('close', async event => {
        console.log(chalk.blueBright('Extract URLS finished.'));
        await processResponses(finalUrlsToDownload, tempUrls);
        console.log(chalk.blue('Filter URLS images finished.'));
        await downloadResults(finalUrlsToDownload, folder);
        console.log(chalk.green('All files are downloaded!'));
    });
}

const grabImagesByUrl = async (url, folder, max) => {
    const spinner = ora({spinner: cliSpinners.dots, color: 'blue', text: 'Start grabbing..'}).start();
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    processPageRessources(page, folder);

    await page.goto(url);
    spinner.stop();
    await page.close();
    await browser.close();
};

async function extractImagesProcess(newUrl, tempUrls) {
    if (!(/.*\.(jpg|png|svg|gif|jpeg|tif|tiff|webp)(.*)$/.test(newUrl))) return;
    tempUrls.push(axios.get(newUrl));
}


async function processResponses(finalImagesToDownloadPromises, tempRequests) {
    const spinner = ora({spinner: cliSpinners.dots3, color: 'yellow', text: 'Check images..'}).start();
    const responses = await Promise.allSettled(tempRequests);
    responses.forEach(
        (resp) => {
            if(resp.status === "fulfilled") {
                const contentType = resp.value.headers['content-type'];
                if (isImage(contentType) && getExtensionFromMime(contentType)) {
                    finalImagesToDownloadPromises.push({
                        promise: axios({url: resp.value.config.url, method: "get", responseType: "stream"}),
                        extension: getExtensionFromMime(contentType)
                    });
                }
            }
        });
    spinner.stop();
}

async function downloadResults(imagesPromises, folder) {
    const spinner = ora({spinner: cliSpinners.bounce, color: 'green', text: 'Downloading All..'}).start();
    const streams = await Promise.allSettled(imagesPromises.map(imgProm => imgProm.promise));
    const subFolderName = moment().format('DD-MM-YYYY-hh-mm-ss');
    if (!fs.existsSync(`${folder}/${subFolderName}`)){
        fs.mkdirSync(`${folder}/${subFolderName}`);
    }

    streams.forEach(
        (resp, i) => {
         if(resp.status === "fulfilled") {
             const ws = getStreams(`${folder}/${subFolderName}/image-${i}${imagesPromises[i].extension}`);
             resp.value.data.pipe(ws);
         }
    });

    spinner.stop();
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


export {grabImagesByUrl};