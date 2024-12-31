import { isEmpty } from "lodash";
import { K1WebTwain } from '../lib/k1scanservice/js/k1ss.js';

export const generateScanFileName = () => {
    return 'ScanFile' + (Math.floor((Math.random() * 10000) + 100000));
}

export const convertRawOptions = (rawOptions, isSwapKeyValue = false) => {
    return isEmpty(rawOptions) ? [] : Object.keys(rawOptions).map((key) => {
        return isSwapKeyValue ? { value: rawOptions[key], display: key } : { value: key, display: rawOptions[key] };
    })
}

export const renderOptions = (options) => {
    return isEmpty(options) ? [] : options;
}

export const defaultOptionsValue = (options) => {
    return options.length > 0 && !isEmpty(options[0]) ? options[0].value : 0;
}

export const saveDefaultScanSettings = (outputType, ocrType, scanSource) => {
    let isUseOcr = (outputType === K1WebTwain.Options.OutputFiletype.PDF ||
        outputType === K1WebTwain.Options.OutputFiletype['PDF/A']) &&
        parseInt(ocrType) !== K1WebTwain.Options.OcrType.None;

    let scanSettings = getDefaultScanSettings();

    if (scanSettings) {
        scanSettings.ScanType = outputType;
        scanSettings.UseOCR = isUseOcr;
        scanSettings.OCRType = ocrType;
        scanSettings.ScanSource = scanSource;
    } else {
        scanSettings = {
            ScanType: outputType,
            UseOCR: isUseOcr,
            OCRType: ocrType,
            ScanSource: scanSource
        }
    }

    let set_cookies = function (name, value, days) {
        let expires = "";
        if (days) {
            let date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    };

    set_cookies("DefaultScanSettings", JSON.stringify(scanSettings), 365);
}

export const getDefaultScanSettings = () => {
    let get_cookie = function (name) {
        let nameEQ = name + "=";
        let ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    };

    let strCookie = get_cookie("DefaultScanSettings");
    if (strCookie != null) {
        try {
            return JSON.parse(strCookie);
        } catch (err) {
            return null;
        }
    }

    return null;
}
