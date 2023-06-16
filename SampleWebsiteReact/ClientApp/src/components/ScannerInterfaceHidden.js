import React, { Component } from 'react';
import $ from 'jquery';
import { isEmpty } from 'lodash';
import { K1WebTwain } from '../lib/k1scanservice/js/k1ss_obfuscated.js';
import { convertRawOptions, defaultOptionsValue, generateScanFileName, renderOptions } from '../utils/scanningUtils.js';

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
            outputFilename: '',
            isDisplayUI: false
        };
        this.handleAcquireClick = this.handleAcquireClick.bind(this);
        this.onDeviceChange = this.onDeviceChange.bind(this);
        this.onDocumentSourceChange = this.onDocumentSourceChange.bind(this);
    }

    componentDidMount() {
        let self = this;
        let configuration = {
            onComplete: function () { }, //function called when scan complete
            viewButton: null, //This is optional. Specify a element that when clicked will view scanned document
            fileUploadURL: document.location.origin + '/Home/UploadFile', //This is the service that the scanned document will be uploaded to when complete
            clientID: "" + Date.now(), //This is a way to identify the user who is scanning.  It should be unique per user.  Session ID could be used if no user logged in
            setupFile: document.location.origin + '/Home/DownloadSetup', //location of the installation file if service doesn't yet exist
            interfacePath: document.location.origin + "/interface.html", // This is optional if your application lives under a subdomain.
            scannerInterface: K1WebTwain.Options.ScannerInterface.Hidden,
            scanButton: $("#scanbtn"), // the scan button
        };

        K1WebTwain.Configure(configuration).then(() => {
            this.setState({ 
                isDisplayUI: false,
            });

            K1WebTwain.ResetService().then(function () {
                setTimeout(() => {
                    self.renderSelection();
                    self.setState({ 
                        isDisplayUI: true,
                    });
                },4000)
            });
        }).catch(err => {
            console.log(err);
            K1WebTwain.ResetService();
        });
    }

    renderSelection() {
        K1WebTwain.GetDevices().then(devices => {
            let mappedDevices = devices.map(device => ({ value: device.id, display: device.name }));
            let mappedOcrTypes = convertRawOptions(K1WebTwain.Options.OcrType, true);
            let mappedFileTypeOptions = convertRawOptions(K1WebTwain.Options.OutputFiletype, true);
            
            this.setState({
                discoveredDevices: renderOptions(mappedDevices),
                ocrOptions: renderOptions(mappedOcrTypes),
                fileTypeOptions: renderOptions(mappedFileTypeOptions),
                outputFilename: generateScanFileName()
            });

            this.onDeviceChange(defaultOptionsValue(mappedDevices));
        }).catch(err => {
            console.error(err);
        });
    }

    onDeviceChange(deviceId) {
        K1WebTwain.Device(deviceId).then(deviceInfo => {
            if(!isEmpty(deviceInfo)) {
                let documentSourceOptions = Object.keys(deviceInfo.documentSourceIds).map((key) => {
                    return { value: key, display: deviceInfo.documentSourceIds[key].name };
                });

                this.setState({
                    selectedDevice: deviceInfo,
                    selectedDocumentSource: defaultOptionsValue(documentSourceOptions),
                    duplexOptions: [],
                    pageSizeOptions: [],
                    pixelTypeOptions: [],
                    resolutionOptions: [],
                    documentSourceOptions: renderOptions(documentSourceOptions),
                });

                this.onDocumentSourceChange(defaultOptionsValue(documentSourceOptions));
            }
        }).catch(err => {
            console.log(err);
            this.setState({
                selectedDevice: {},
                selectedDocumentSource: 0,
                duplexOptions: [],
                pageSizeOptions: [],
                pixelTypeOptions: [],
                resolutionOptions: [],
                documentSourceOptions: [],
            });
        })
    }

    onDocumentSourceChange(documentSourceId) {
        let selectedDocumentSource = this.state.selectedDevice.documentSourceIds[documentSourceId];

        let duplexOptions = [],
            pageSizeOptions = [],
            pixelTypeOptions = [],
            resolutionOptions = [];

        if (!!selectedDocumentSource) {
            duplexOptions = convertRawOptions(selectedDocumentSource.duplexIds);
            pageSizeOptions = convertRawOptions(selectedDocumentSource.pageSizeIds);
            pixelTypeOptions = convertRawOptions(selectedDocumentSource.pixelTypeIds);
            resolutionOptions = convertRawOptions(selectedDocumentSource.resolutionIds);
        } else {
            selectedDocumentSource = null;
        }

        this.setState({
            selectedDuplexOption: defaultOptionsValue(duplexOptions),
            selectedPageSizeOption: defaultOptionsValue(pageSizeOptions),
            selectedPixelTypeOption: defaultOptionsValue(pixelTypeOptions),
            selectedResolutionOption: defaultOptionsValue(resolutionOptions),
            selectedDocumentSource: documentSourceId,
            duplexOptions: renderOptions(duplexOptions),
            pageSizeOptions: renderOptions(pageSizeOptions),
            pixelTypeOptions: renderOptions(pixelTypeOptions),
            resolutionOptions: renderOptions(resolutionOptions),
        });
    }

    handleAcquireClick() {
        this.setState({
            isDisplayUI: false
        })
        let acquireRequest = {
            deviceId: this.state.selectedDevice.id,
            resolutionId: this.state.selectedResolutionOption,
            pixelTypeId: this.state.selectedPixelTypeOption,
            pageSizeId: this.state.selectedPageSizeOption,
            documentSourceId: this.state.selectedDocumentSource,
            duplexId: this.state.selectedDuplexOption,
            filetype: this.state.selectedFileTypeOption,
            ocrType: this.state.selectedOcrOption,
            filename: this.state.outputFilename,
        };

        K1WebTwain.Acquire(acquireRequest)
            .then(response => {
                this.props.completeAcquire({
                    acquireResponse: JSON.stringify(response.uploadResponse, null, 4),
                    acquireError: '',
                });
            })
            .catch(err => {
                if(err) {
                    if (!!err.responseText) {
                        this.props.completeAcquire({
                            acquireResponse: '',
                            acquireError: err.responseText,
                        });
                    }
    
                    if (!!err.responseJSON) {
                        try {
                            this.props.completeAcquire({
                                acquireResponse: '',
                                acquireError: JSON.stringify(err.responseJSON, null, 4),
                            });
                        } catch (e) {
                            console.warn(e);
                        }
                    }
    
                    if (err.statusText && err.statusText === 'timeout') {
                        this.props.completeAcquire({
                            acquireResponse: '',
                            acquireError: 'Timeout error while processing/uploading scanned documents.',
                        });
                    }
                }
            });
    }

    render() {
        let documentSource = !isEmpty(this.state.selectedDevice) ? <div id="source-group" className="twain-feature-group" >
            <label className="scanning-label mt-2">Document Source</label>
            <select id="sel-document-source" className="form-control" value={this.state.selectedDocumentSource} onChange={e => this.onDocumentSourceChange(e.target.value)}>
                {this.state.documentSourceOptions.map((device) => <option key={device.value} value={device.value}>{device.display}</option>)}
            </select>
        </div> : "";

        let resolutions = this.state.resolutionOptions.length > 0 ? <div id="dpi-group" className="twain-feature-group" >
            <label className="scanning-label mt-2">Resolution (DPI)</label>
            <select id="sel-dpi" className="form-control" value={this.state.selectedResolutionOption} onChange={e => this.setState({ selectedResolutionOption: e.target.value })}>
                {this.state.resolutionOptions.map((device) => <option key={device.value} value={device.value}>{device.display}</option>)}
            </select>
        </div> : "";

        let pixelTypes = this.state.pixelTypeOptions.length > 0 ? <div id="color-group" className="twain-feature-group" >
            <label className="scanning-label mt-2">Color</label>
            <select id="sel-color" className="form-control" value={this.state.selectedPixelTypeOption} onChange={e => this.setState({ selectedPixelTypeOption: e.target.value })}>
                {this.state.pixelTypeOptions.map((device) => <option key={device.value} value={device.value}>{device.display}</option>)}
            </select>
        </div> : "";

        let pageSizes = this.state.pageSizeOptions.length > 0 ? <div id="size-group" className="twain-feature-group" >
            <label className="scanning-label mt-2">Page Size</label>
            <select id="sel-page-size" className="form-control" value={this.state.selectedPageSizeOption} onChange={e => this.setState({ selectedPageSizeOption: e.target.value })}>
                {this.state.pageSizeOptions.map((device) => <option key={device.value} value={device.value}>{device.display}</option>)}
            </select>
        </div> : "";

        let duplexOptions = this.state.duplexOptions.length > 0 ? <div id="size-group" className="twain-feature-group" >
            <label className="scanning-label mt-2">Duplex Option:</label>
            <select id="sel-page-size" className="form-control" value={this.state.selectedDuplexOption} onChange={e => this.setState({ selectedDuplexOption: e.target.value })}>
                {this.state.duplexOptions.map((device) => <option key={device.value} value={device.value}>{device.display}</option>)}
            </select>
        </div> : "";

        return (
            this.state.isDisplayUI &&
            <div id="k1interface-hidden" className="show">
                <div>
                    <div id="device-group" className="twain-feature-group">
                            <label className="scanning-label">Device</label>
                        <select id="sel-scanner" className="form-control" value={this.state.selectedDevice.id} onChange={e => this.onDeviceChange(e.target.value)}>
                            {this.state.discoveredDevices.map((device) => <option key={device.value} value={device.value}>{device.display}</option>)}
                        </select>
                    </div>

                    {documentSource}
                    {resolutions}
                    {pixelTypes}
                    {pageSizes}
                    {duplexOptions}

                    <label className="scanning-label mt-2">Output File Name</label>
                    <input id="sel-output-name" className="form-control" value={this.state.outputFilename} placeholder="Please enter a file name" onChange={e => this.setState({ outputFilename: e.target.value })} />

                    <label className="scanning-label mt-2">Output File Type</label>
                    <select id="sel-output" className="form-control" value={this.state.selectedFileTypeOption} onChange={e => this.setState({ selectedFileTypeOption: e.target.value })}>
                        {this.state.fileTypeOptions.map((device) => <option key={device.value} value={device.value}>{device.display}</option>)}
                    </select>

                    <label className="scanning-label mt-2">OCR Type</label>
                    <select id="sel-ocr-type" className="form-control" value={this.state.selectedOcrOption} onChange={e => this.setState({ selectedOcrOption: e.target.value })}>
                        {this.state.ocrOptions.map((device) => <option key={device.value} value={device.value}>{device.display}</option>)}
                    </select>

                    <br />

                    <div className="input-group">
                        <div className="input-group-btn">
                            <button id="btn-acquire" type="button" className="btn btn-primary" aria-label="Bold" onClick={this.handleAcquireClick}>
                                <span>Scan</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
