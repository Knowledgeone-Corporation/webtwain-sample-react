import React, { Component } from "react";
import $ from "jquery";
import { K1WebTwain } from "../lib/k1scanservice/js/k1ss.js";
import {
    convertRawOptions,
    generateScanFileName,
    saveDefaultScanSettings,
    getDefaultScanSettings,
    renderOptions,
} from "../utils/scanningUtils.js";

export class ScannerInterfaceDesktop extends Component {
    constructor(props) {
        super(props);
        this.state = {
            discoveredDevices: [],
            selectedDeviceId: -1,
            ocrOptions: [],
            selectedOcrOption: K1WebTwain.Options.OcrType.None,
            fileTypeOptions: [],
            selectedFileTypeOption: K1WebTwain.Options.OutputFiletype.PDF,
            outputFilename: "",
            isDisplayUI: false,
            isDisplayScanningSection: false,
            isDisableScanButton: true,
            isDisableFinalizeSection: true,
            isDisplayImageOutputType: true,
            isDisplayFileRestriction: false,
        };
        this.renderSelection = this.renderSelection.bind(this);
        this.handleDeviceChange = this.handleDeviceChange.bind(this);
        this.handleFileTypeChange = this.handleFileTypeChange.bind(this);
        this.handlOcrTypeChange = this.handlOcrTypeChange.bind(this);
        this.handleAcquireClick = this.handleAcquireClick.bind(this);
        this.handleCancelFinalization = this.handleCancelFinalization.bind(this);
        this.handleAttachDocument = this.handleAttachDocument.bind(this);
        this.handleSaveDocument = this.handleSaveDocument.bind(this);
        this.handleError = this.handleError.bind(this);
    }

    componentDidMount() {
        let self = this;
        let configuration = {
            onComplete: function () { }, //function called when scan complete
            viewButton: null, //This is optional. Specify a element that when clicked will view scanned document
            fileUploadURL: document.location.origin + "/Home/UploadFile", //This is the service that the scanned document will be uploaded to when complete
            fileUploadHeaders: [
                {
                    key: "X-Access-Token",
                    value: "Test",
                },
            ], // This is optional. Specify additional headers for the request to the upload server.
            clientID: "" + Date.now(), //This is a way to identify the user who is scanning.  It should be unique per user.  Session ID could be used if no user logged in
            setupFile: document.location.origin + "/Home/DownloadSetup", //location of the installation file if service doesn't yet exist
            licenseFile: document.location.origin + "/Home/K1Licence", //location of the license file If it unset, value will fallback to Current website url + '/Home/K1Licence'
            interfacePath: document.location.origin + "/interface.html", // This is optional if your application lives under a subdomain.
            scannerInterface: K1WebTwain.Options.ScannerInterface.Desktop,
            scanButton: $("#scanbtn"), // the scan button
        };

        K1WebTwain.Configure(configuration)
            .then(() => {
                this.setState({
                    isDisplayUI: false,
                });

                K1WebTwain.ResetService().then(function () {
                    //setTimeout(() => {
                    self.setState({
                        isDisplayUI: true,
                    });
                    //}, 4000)
                });
            })
            .catch((err) => {
                console.log(err);
                K1WebTwain.ResetService();
            });
    }

    renderSelection() {
        K1WebTwain.GetDevices()
            .then((devices) => {
                let mappedDevices = devices.map((device) => ({
                    value: device.id,
                    display: device.name,
                }));
                let mappedOcrTypes = convertRawOptions(
                    K1WebTwain.Options.OcrType,
                    true
                );
                let mappedFileTypeOptions = convertRawOptions(
                    K1WebTwain.Options.OutputFiletype,
                    true
                );

                this.setState({
                    discoveredDevices: renderOptions(mappedDevices),
                    ocrOptions: renderOptions(mappedOcrTypes),
                    fileTypeOptions: renderOptions(mappedFileTypeOptions),
                    outputFilename: generateScanFileName(),
                    isDisplayScanningSection: true,
                });

                let scanSettings = getDefaultScanSettings();
                if (scanSettings) {
                    this.setState({
                        selectedDeviceId: scanSettings.ScanSource,
                        selectedFileTypeOption: scanSettings.ScanType,
                        selectedOcrOption: scanSettings.UseOCR
                            ? scanSettings.OCRType
                            : K1WebTwain.Options.OcrType.None,
                        isDisableScanButton: parseInt(scanSettings.ScanSource) === -1,
                    });
                }
            })
            .catch((err) => {
                console.error(err);
            });
    }

    handleDeviceChange(e) {
        let deviceId = e.target.value;
        this.setState({
            selectedDeviceId: deviceId,
            isDisableScanButton: parseInt(e.target.value) === -1,
        });

        let defaultSettings = getDefaultScanSettings();
        saveDefaultScanSettings(
            defaultSettings?.ScanType ?? this.state.selectedFileTypeOption,
            defaultSettings?.OCRType ?? this.state.selectedOcrOption,
            deviceId
        );
    }

    handleAcquireClick() {
        let acquireRequest = {
            deviceId: this.state.selectedDeviceId,
        };

        K1WebTwain.StartScan(acquireRequest)
            .then((response) => {
                if (response.pageCount > 1) {
                    this.setState({
                        isDisplayFileRestriction: true,
                    });
                    let fileType = this.state.selectedFileTypeOption;
                    if (
                        fileType === "JPG" ||
                        fileType === "GIF" ||
                        fileType === "PNG" ||
                        fileType === "BMP"
                    ) {
                        this.setState({ selectedFileTypeOption: K1WebTwain.Options.OutputFiletype.TIFF });
                    }
                    this.setState({ isDisplayImageOutputType: false });
                } else {
                    this.setState({
                        isDisplayFileRestriction: false,
                        isDisplayImageOutputType: true,
                    });
                }

                this.setState({
                    isDisableFinalizeSection: false,
                    isDisableScanButton: true,
                });
            })
            .catch((err) => {
                this.handleError(err);
            });
    }

    handleFileTypeChange(e) {
        let outputType = e.target.value;
        this.setState({ selectedFileTypeOption: outputType });
        let defaultSettings = getDefaultScanSettings();
        saveDefaultScanSettings(
            outputType,
            defaultSettings?.OCRType ?? this.state.selectedOcrOption,
            defaultSettings?.ScanSource ?? this.state.selectedDevice
        );
    }

    handlOcrTypeChange(e) {
        let ocrType = e.target.value;
        this.setState({ selectedOcrOption: ocrType });
        let defaultSettings = getDefaultScanSettings();
        saveDefaultScanSettings(
            defaultSettings?.ScanType ?? this.state.selectedFileTypeOption,
            ocrType,
            defaultSettings?.ScanSource ?? this.state.selectedDevice
        );
    }

    handleCancelFinalization(e) {
        K1WebTwain.ClearAllScannedPages()
            .then(() => {
                this.setState({
                    isDisableFinalizeSection: true,
                    isDisableScanButton: false,
                });
            })
            .catch((err) => {
                this.handleError(err);
            });
    }

    handleAttachDocument(e) {
        K1WebTwain.ValidatePageSize({
            ocrType: this.state.selectedOcrOption,
            fileType: this.state.selectedFileTypeOption,
            saveToType: K1WebTwain.Options.SaveToType.Upload,
            generateDocument: () => {
                this.generateDocument(K1WebTwain.Options.SaveToType.Upload);
            },
        });
    }

    handleSaveDocument(e) {
        K1WebTwain.ValidatePageSize({
            ocrType: this.state.selectedOcrOption,
            fileType: this.state.selectedFileTypeOption,
            saveToType: K1WebTwain.Options.SaveToType.Local,
            generateDocument: () => {
                this.generateDocument(K1WebTwain.Options.SaveToType.Local);
            },
        });
    }

    generateDocument(saveToType) {
        K1WebTwain.GenerateDocument({
            filetype: this.state.selectedFileTypeOption,
            ocrType: this.state.selectedOcrOption,
            saveToType: saveToType,
            filename: this.state.outputFilename,
        })
            .then((response) => {
                let responseMessage = response.uploadResponse;

                if (saveToType === K1WebTwain.Options.SaveToType.Local) {
                    responseMessage = {
                        filename: response.filename,
                        fileSize: `${response.fileLength} (${response.sizeDisplay})`,
                        fileExtension: response.extension,
                    };
                }

                this.props.completeAcquire({
                    acquireResponse: JSON.stringify(responseMessage, null, 4),
                    acquireError: "",
                    saveToType: saveToType,
                });
            })
            .catch((err) => {
                this.handleError(err);
            });
    }

    handleError(err) {
        if (err) {
            if (!!err.responseText) {
                this.props.completeAcquire({
                    acquireResponse: "",
                    acquireError: err.responseText,
                });
            }

            if (!!err.responseJSON) {
                try {
                    this.props.completeAcquire({
                        acquireResponse: "",
                        acquireError: JSON.stringify(err.responseJSON, null, 4),
                    });
                } catch (e) {
                    console.warn(e);
                }
            }

            if (err.statusText && err.statusText === "timeout") {
                this.props.completeAcquire({
                    acquireResponse: "",
                    acquireError:
                        "Timeout error while processing/uploading scanned documents.",
                });
            }
        }
    }

    render() {
        return (
            this.state.isDisplayUI && (
                <div>
                    {!this.state.isDisplayScanningSection ? (
                        <div id="k1interface-visible" className="show">
                            <div>
                                <label className="scanning-label">
                                    Initialize Scan Process:
                                </label>
                            </div>
                            <div className="input-group">
                                <div className="input-group-btn">
                                    <button
                                        id="scanbtn"
                                        type="button"
                                        className="btn btn-primary"
                                        aria-label="Bold"
                                        onClick={this.renderSelection}
                                    >
                                        <span>Initialize</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div id="k1interface-hidden" className="show">
                            <div
                                className={`${!this.state.isDisableFinalizeSection
                                    ? "section-disabled"
                                    : ""
                                    }`}
                            >
                                <div id="device-group" className="twain-feature-group">
                                    <label className="scanning-label">Device</label>
                                    <select
                                        id="sel-scanner"
                                        className="form-control"
                                        value={this.state.selectedDeviceId}
                                        onChange={this.handleDeviceChange}
                                    >
                                        {this.state.discoveredDevices.map((device) => (
                                            <option key={device.value} value={device.value}>
                                                {device.display}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <br />
                                <div className="input-group">
                                    <div className="input-group-btn">
                                        <button
                                            id="btn-acquire"
                                            type="button"
                                            className="btn btn-primary"
                                            aria-label="Bold"
                                            onClick={this.handleAcquireClick}
                                            disabled={this.state.isDisableScanButton}
                                        >
                                            <span>Scan</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div
                                className={`finalize-section mt-2 ${this.state.isDisableFinalizeSection
                                    ? "section-disabled"
                                    : ""
                                    }`}
                            >
                                <label className="scanning-label mt-2">
                                    Output File Name
                                </label>
                                <input
                                    id="sel-output-name"
                                    className="form-control"
                                    type="text"
                                    value={this.state.outputFilename}
                                    placeholder="Please enter a file name"
                                    onChange={(e) =>
                                        this.setState({ outputFilename: e.target.value })
                                    }
                                />

                                <label className="scanning-label mt-2">
                                    Output File Type
                                </label>
                                {this.state.isDisplayFileRestriction && (
                                    <span className="filetype-restriction">
                                        File types restricted for multiple page scans
                                    </span>
                                )}
                                <select
                                    id="sel-output"
                                    className="form-control"
                                    value={this.state.selectedFileTypeOption}
                                    onChange={this.handleFileTypeChange}
                                >
                                    {this.state.fileTypeOptions.map(
                                        (device) =>
                                            (device.value === "PDF" || device.value === "PDF/A" || device.value === "TIF" || this.state.isDisplayImageOutputType) && (
                                                <option key={device.value} value={device.value}>
                                                    {device.display}
                                                </option>
                                            )
                                    )}
                                </select>

                                {
                                    (this.state.selectedFileTypeOption === K1WebTwain.Options.OutputFiletype.PDF ||
                                        this.state.selectedFileTypeOption === K1WebTwain.Options.OutputFiletype['PDF/A']) && <div>
                                        <label className="scanning-label mt-2">OCR Type</label>
                                        <select
                                            id="sel-ocr-type"
                                            className="form-control"
                                            value={this.state.selectedOcrOption}
                                            onChange={this.handlOcrTypeChange}
                                        >
                                            {this.state.ocrOptions.map((device) => (
                                                <option key={device.value} value={device.value}>
                                                    {device.display}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                }

                                <div className="input-group mb-3">
                                    <div className="input-group-btn">
                                        <button
                                            id="btn-attach"
                                            type="button"
                                            className="btn btn-primary"
                                            aria-label="Bold"
                                            onClick={this.handleAttachDocument}
                                        >
                                            <span>ATTACH DOCUMENT</span>
                                        </button>
                                        <button
                                            id="btn-save-locally"
                                            type="button"
                                            className="btn btn-primary ml-2"
                                            aria-label="Bold"
                                            onClick={this.handleSaveDocument}
                                        >
                                            <span>SAVE LOCALLY</span>
                                        </button>
                                        <button
                                            id="btn-cancel-finalization"
                                            type="button"
                                            className="btn btn-primary ml-2"
                                            aria-label="Bold"
                                            onClick={this.handleCancelFinalization}
                                        >
                                            <span>CANCEL</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )
        );
    }
}
