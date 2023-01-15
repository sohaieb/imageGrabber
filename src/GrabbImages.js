import puppeteer from "puppeteer";
import fs from 'fs';
import axios from "axios";
import ora from "ora";
import cliSpinners from "cli-spinners";
import chalk from "chalk";
import moment from "moment";
import {isImage, getExtensionFromMime, getStreams, extractImagesProcess} from "./vendor/Helpers.js";

export async function grabImagesByUrl(url, folder, max) {
    const spinner = ora({spinner: cliSpinners.dots, color: 'blue', text: 'Start grabbing..'}).start();
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    processPageRessources(page, folder);
    await page.goto(url);
    spinner.stop();
    await page.close();
    await browser.close();
}

function processPageRessources(page, folder) {
    const finalUrlsToDownload = [];
    const tempUrls = [];
    collectUrls(page, tempUrls);
    onUrlsCollected(page, finalUrlsToDownload, tempUrls, folder);
}


async function processResponses(finalImagesToDownloadPromises, tempRequests) {
    const spinner = ora({spinner: cliSpinners.dots3, color: 'yellow', text: 'Check images..'}).start();
    const responses = await Promise.allSettled(tempRequests);
    responses.forEach(
        (resp) => {
            if(resp.status === "fulfilled") {
                const respValue = resp.value;
                if (isImage(respValue) && getExtensionFromMime(respValue)) {
                    finalImagesToDownloadPromises.push({
                        promise: axios({url: resp.value.config.url, method: "get", responseType: "stream"}),
                        extension: getExtensionFromMime(respValue)
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

function collectUrls(page, tempUrls) {
    page.on('response', async event => {
        if (!(event.status() >= 300 && event.status() < 400)) {
            await extractImagesProcess(event, tempUrls);
        }
    });
}

function onUrlsCollected(page, finalUrlsToDownload, tempUrls, folder) {
    page.on('close', async event => {
        console.log(chalk.blueBright('Extract URLS finished.'));
        await processResponses(finalUrlsToDownload, tempUrls);
        console.log(chalk.blue('Filter URLS images finished.'));
        await downloadResults(finalUrlsToDownload, folder);
        console.log(chalk.green('All files are downloaded!'));
    });
}