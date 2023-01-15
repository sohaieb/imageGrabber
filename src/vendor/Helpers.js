import axios from "axios";
import fs from "fs";

export async function extractImagesProcess(httpEvent, tempUrls) {
    const checkIfImage = /.*((\.(jpg|png|svg|gif|jpeg|tif|tiff|webp))|(data:image\/)|(image\/))(.*)$/.test(httpEvent.headers()['content-type']);
    if (!checkIfImage) return;
    tempUrls.push(axios.get(httpEvent.url()));
}

export function getStreams(fileName) {
    return fs.createWriteStream(fileName, {encoding: 'base64'});
}

export function isImage(imageContent) {
    return /.*((\.(jpg|png|svg|gif|jpeg|tif|tiff|webp))|(data:image\/))(.*)$/.test(imageContent.headers['content-type'] || imageContent.config.url);
}

function getExtentionFromString(respValue) {
    switch (respValue) {
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
    }
}

export function getExtensionFromMime(respValue) {
    const mimeType = respValue.headers['content-type'];
    if(mimeType) {
        return getExtentionFromString(respValue);
    } else if(respValue.config.url) {
        return getExtentionFromString(/(data:(image\/.*));(.*)$/.exec(respValue.config.url)[2]);
    } else {
        return false;
    }
}