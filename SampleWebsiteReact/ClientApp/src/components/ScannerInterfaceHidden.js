import React, { Component } from "react";
import $ from "jquery";
import { isEmpty } from "lodash";
import { K1WebTwain } from "../lib/k1scanservice/js/k1ss.js";
import {
    convertRawOptions,
    defaultOptionsValue,
    generateScanFileName,
    saveDefaultScanSettings,
    getDefaultScanSettings,
    getScannerDetails,
    renderOptions,
} from "../utils/scanningUtils.js";

export class ScannerInterfaceHidden extends Component {
    constructor(props) {
        super(props);
        this.state = {
            discoveredDevices: [],
            selectedDevice: {},
            documentSourceOptions: [],
            selectedDocumentSource: 0,
            duplexOptions: [],
            selectedDuplexOption: 0,
            pageSizeOptions: [],
            selectedPageSizeOption: 0,
            pixelTypeOptions: [],
            selectedPixelTypeOption: 0,
            resolutionOptions: [],
            selectedResolutionOption: 0,
            ocrOptions: [],
            selectedOcrOption: K1WebTwain.Options.OcrType.None,
            fileTypeOptions: [],
            selectedFileTypeOption: K1WebTwain.Options.OutputFiletype.PDF,
            outputFilename: "",
            isDisplayUI: false,
            isDisplayScanningSection: false,
            isDisableScanButton: true,
            isDisableFinalizeSection: true,
        };

        this.renderSelection = this.renderSelection.bind(this);
        this.handleAcquireClick = this.handleAcquireClick.bind(this);
        this.handleDeviceChange = this.handleDeviceChange.bind(this);
        this.onDocumentSourceChange = this.handleDocumentSourceChange.bind(this);
        this.handleFileTypeChange = this.handleFileTypeChange.bind(this);
        this.handlOcrTypeChange = this.handlOcrTypeChange.bind(this);
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
            scannerInterface: K1WebTwain.Options.ScannerInterface.Hidden,
            scanButton: $("#scanbtn"), // the scan button
        };

        K1WebTwain.Configure(configuration)
            .then(() => {
                this.setState({
                    isDisplayUI: false,
                });

                K1WebTwain.ResetService().then(function () {
                    self.setState({
                        isDisplayUI: true,
                    });
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

                if (scanSettings?.ScannerDetails?.ScanSource) {
                    this.setState({
                        selectedFileTypeOption: scanSettings.ScanType,
                        selectedOcrOption: scanSettings.UseOCR
                            ? scanSettings.OCRType
                            : K1WebTwain.Options.OcrType.None
                    });
                    this.handleDeviceChange(parseInt(scanSettings.ScannerDetails.ScanSource));
                } else {
                    this.handleDeviceChange(defaultOptionsValue(mappedDevices));
                }
            })
            .catch((err) => {
                console.error(err);
            });
    }

    handleDeviceChange(deviceId) {
        K1WebTwain.Device(deviceId)
            .then((deviceInfo) => {
                let defaultSettings = getDefaultScanSettings();

                if (!isEmpty(deviceInfo)) {
                    let documentSourceOptions = Object.keys(
                        deviceInfo.documentSourceIds
                    ).map((key) => {
                        return {
                            value: key,
                            display: deviceInfo.documentSourceIds[key].name,
                        };
                    });

                    const defaultDocumentSource = defaultSettings?.ScannerDetails?.DocumentSource ?? defaultOptionsValue(documentSourceOptions);

                    this.setState({
                        selectedDevice: deviceInfo,
                        selectedDocumentSource: defaultDocumentSource,
                        duplexOptions: [],
                        pageSizeOptions: [],
                        pixelTypeOptions: [],
                        resolutionOptions: [],
                        documentSourceOptions: renderOptions(documentSourceOptions),
                        isDisableScanButton: false,
                    });

                    this.handleDocumentSourceChange(defaultDocumentSource);
                } else {
                    this.setState({
                        selectedDevice: {
                            id: this.state.discoveredDevices[0].value,
                            name: this.state.discoveredDevices[0].display,
                            isDefault: true,
                            documentSourceIds: {},
                        },
                        selectedDocumentSource: 0,
                        duplexOptions: [],
                        pageSizeOptions: [],
                        pixelTypeOptions: [],
                        resolutionOptions: [],
                        documentSourceOptions: [],
                        isDisableScanButton: true,
                    });
                }

                let scannerDetails = getScannerDetails(defaultSettings);
                scannerDetails.ScanSource = deviceId;
                this.saveDefaultScannerDetails(defaultSettings, scannerDetails);
            })
            .catch((err) => {
                console.log(err);
                this.setState({
                    selectedDevice: {},
                    selectedDocumentSource: 0,
                    duplexOptions: [],
                    pageSizeOptions: [],
                    pixelTypeOptions: [],
                    resolutionOptions: [],
                    documentSourceOptions: [],
                    isDisableScanButton: true,
                });
            });
    }

    handleDocumentSourceChange(documentSourceId) {
        let defaultSettings = getDefaultScanSettings();
        let scannerDetails = getScannerDetails(defaultSettings);

        let selectedDocumentSource =
            this.state.selectedDevice.documentSourceIds[documentSourceId];

        let duplexOptions = [],
            pageSizeOptions = [],
            pixelTypeOptions = [],
            resolutionOptions = [];

        if (!!selectedDocumentSource) {
            duplexOptions = convertRawOptions(selectedDocumentSource.duplexIds);
            pageSizeOptions = convertRawOptions(selectedDocumentSource.pageSizeIds);
            pixelTypeOptions = convertRawOptions(selectedDocumentSource.pixelTypeIds);
            resolutionOptions = convertRawOptions(
                selectedDocumentSource.resolutionIds
            );
        } else {
            selectedDocumentSource = null;
        }

        this.setState({
            selectedDuplexOption: scannerDetails?.Duplex ?? defaultOptionsValue(duplexOptions),
            selectedPageSizeOption: scannerDetails?.PageSize ?? defaultOptionsValue(pageSizeOptions),
            selectedPixelTypeOption: scannerDetails?.Color ?? defaultOptionsValue(pixelTypeOptions),
            selectedResolutionOption: scannerDetails?.Resolution ?? defaultOptionsValue(resolutionOptions),
            selectedDocumentSource: documentSourceId,
            duplexOptions: renderOptions(duplexOptions),
            pageSizeOptions: renderOptions(pageSizeOptions),
            pixelTypeOptions: renderOptions(pixelTypeOptions),
            resolutionOptions: renderOptions(resolutionOptions),
        });

        scannerDetails.DocumentSource = documentSourceId;
        this.saveDefaultScannerDetails(defaultSettings, scannerDetails);
    }

    handleResolutionChange(selectedResolution) {
        this.setState({ selectedResolutionOption: selectedResolution })
        let defaultSettings = getDefaultScanSettings();
        let scannerDetails = getScannerDetails(defaultSettings);
        scannerDetails.Resolution = selectedResolution;
        this.saveDefaultScannerDetails(defaultSettings, scannerDetails);
    }

    handlePixelTypeChange(selectedPixelType) {
        this.setState({ selectedPixelTypeOption: selectedPixelType })
        let defaultSettings = getDefaultScanSettings();
        let scannerDetails = getScannerDetails(defaultSettings);
        scannerDetails.Color = selectedPixelType;
        this.saveDefaultScannerDetails(defaultSettings, scannerDetails);
    }

    handlePageSizeChange(selectedPageSize) {
        this.setState({ selectedPageSizeOption: selectedPageSize })
        let defaultSettings = getDefaultScanSettings();
        let scannerDetails = getScannerDetails(defaultSettings);
        scannerDetails.PageSize = selectedPageSize;
        this.saveDefaultScannerDetails(defaultSettings, scannerDetails);
    }

    handleDuplexChange(selectedDuplex) {
        this.setState({ selectedDuplexOption: selectedDuplex })
        let defaultSettings = getDefaultScanSettings();
        let scannerDetails = getScannerDetails(defaultSettings);
        scannerDetails.Duplex = selectedDuplex;
        this.saveDefaultScannerDetails(defaultSettings, scannerDetails);
    }

    saveDefaultScannerDetails(defaultSettings, scannerDetails) {
        saveDefaultScanSettings(
            defaultSettings?.ScanType ?? this.state.selectedFileTypeOption,
            defaultSettings?.OCRType ?? this.state.selectedOcrOption,
            scannerDetails
        );
    }

    handleAcquireClick() {
        let acquireRequest = {
            deviceId: this.state.selectedDevice.id,
            resolutionId: this.state.selectedResolutionOption,
            pixelTypeId: this.state.selectedPixelTypeOption,
            pageSizeId: this.state.selectedPageSizeOption,
            documentSourceId: this.state.selectedDocumentSource,
            duplexId: this.state.selectedDuplexOption,
        };

        K1WebTwain.StartScan(acquireRequest)
            .then(() => {
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
            defaultSettings?.OCRType ?? this.state.selectedOcrOption
        );
    }

    handlOcrTypeChange(e) {
        let ocrType = e.target.value;
        this.setState({ selectedOcrOption: ocrType });
        let defaultSettings = getDefaultScanSettings();

        saveDefaultScanSettings(
            defaultSettings?.ScanType ?? this.state.selectedFileTypeOption,
            ocrType
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
        let documentSource =
            !isEmpty(this.state.selectedDevice) &&
                this.state.selectedDevice.id !== -1 ? (
                <div id="source-group" className="twain-feature-group">
                    <label className="scanning-label mt-2">Document Source</label>
                    <select
                        id="sel-document-source"
                        className="form-control"
                        value={this.state.selectedDocumentSource}
                        onChange={(e) => this.handleDocumentSourceChange(e.target.value)}
                    >
                        {this.state.documentSourceOptions.map((device) => (
                            <option key={device.value} value={device.value}>
                                {device.display}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                ""
            );

        let resolutions =
            this.state.resolutionOptions.length > 0 ? (
                <div id="dpi-group" className="twain-feature-group">
                    <label className="scanning-label mt-2">Resolution (DPI)</label>
                    <select
                        id="sel-dpi"
                        className="form-control"
                        value={this.state.selectedResolutionOption}
                        onChange={(e) => this.handleResolutionChange(e.target.value)}
                    >
                        {this.state.resolutionOptions.map((device) => (
                            <option key={device.value} value={device.value}>
                                {device.display}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                ""
            );

        let pixelTypes =
            this.state.pixelTypeOptions.length > 0 ? (
                <div id="color-group" className="twain-feature-group">
                    <label className="scanning-label mt-2">Color</label>
                    <select
                        id="sel-color"
                        className="form-control"
                        value={this.state.selectedPixelTypeOption}
                        onChange={(e) => this.handlePixelTypeChange(e.target.value)}
                    >
                        {this.state.pixelTypeOptions.map((device) => (
                            <option key={device.value} value={device.value}>
                                {device.display}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                ""
            );

        let pageSizes =
            this.state.pageSizeOptions.length > 0 ? (
                <div id="size-group" className="twain-feature-group">
                    <label className="scanning-label mt-2">Page Size</label>
                    <select
                        id="sel-page-size"
                        className="form-control"
                        value={this.state.selectedPageSizeOption}
                        onChange={(e) => this.handlePageSizeChange(e.target.value)}
                    >
                        {this.state.pageSizeOptions.map((device) => (
                            <option key={device.value} value={device.value}>
                                {device.display}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                ""
            );

        let duplexOptions =
            this.state.duplexOptions.length > 0 ? (
                <div id="size-group" className="twain-feature-group">
                    <label className="scanning-label mt-2">Duplex Option:</label>
                    <select
                        id="sel-page-size"
                        className="form-control"
                        value={this.state.selectedDuplexOption}
                        onChange={(e) => this.handleDuplexChange(e.target.value)}
                    >
                        {this.state.duplexOptions.map((device) => (
                            <option key={device.value} value={device.value}>
                                {device.display}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                ""
            );

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
                                        value={this.state.selectedDevice.id}
                                        onChange={(e) => this.handleDeviceChange(e.target.value)}
                                    >
                                        {this.state.discoveredDevices.map((device) => (
                                            <option key={device.value} value={device.value}>
                                                {device.display}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {documentSource}
                                {resolutions}
                                {pixelTypes}
                                {pageSizes}
                                {duplexOptions}

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
                                <label className="scanning-label mt-2">Output File Name</label>
                                <input
                                    id="sel-output-name"
                                    className="form-control"
                                    value={this.state.outputFilename}
                                    placeholder="Please enter a file name"
                                    onChange={(e) =>
                                        this.setState({ outputFilename: e.target.value })
                                    }
                                />

                                <label className="scanning-label mt-2">Output File Type</label>
                                <select
                                    id="sel-output"
                                    className="form-control"
                                    value={this.state.selectedFileTypeOption}
                                    onChange={this.handleFileTypeChange}
                                >
                                    {this.state.fileTypeOptions.map((fileType) => (
                                        <option key={fileType.value} value={fileType.value}>
                                            {fileType.display}
                                        </option>
                                    ))}
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
