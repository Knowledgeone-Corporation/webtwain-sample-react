import React, { Component } from 'react';
import $ from 'jquery';
import { K1WebTwain } from '../lib/k1scanservice/js/k1ss.js';
import { convertRawOptions, generateScanFileName, renderOptions } from '../utils/scanningUtils.js';

export class ScannerInterfaceDesktop extends Component {
    constructor(props) {
        super(props);
        this.state = {
            discoveredDevices: [],
            selectedDevice: -1,
            ocrOptions: [],
            selectedOcrOption: K1WebTwain.Options.OcrType.None,
            saveToTypeOptions: [],
            selectedSaveToOption: K1WebTwain.Options.SaveToType.Upload,
            fileTypeOptions: [],
            selectedFileTypeOption: K1WebTwain.Options.OutputFiletype.PDF,
            outputFilename: '',
            isDisplayUI: false,
            isDisableScanButton: true
        };
        this.handleAcquireClick = this.handleAcquireClick.bind(this);
    }

    componentDidMount() {
        let self = this;
        let configuration = {
            onComplete: function () { }, //function called when scan complete
            viewButton: null, //This is optional. Specify a element that when clicked will view scanned document
            fileUploadURL: document.location.origin + '/Home/UploadFile', //This is the service that the scanned document will be uploaded to when complete
            fileUploadHeaders: [
                {
                    key: "X-Access-Token",
                    value: "Test"
                }
            ], // This is optional. Specify additional headers for the request to the upload server.
            clientID: "" + Date.now(), //This is a way to identify the user who is scanning.  It should be unique per user.  Session ID could be used if no user logged in
            setupFile: document.location.origin + '/Home/DownloadSetup', //location of the installation file if service doesn't yet exist
            licenseFile: document.location.origin + '/Home/K1Licence', //location of the license file If it unset, value will fallback to Current website url + '/Home/K1Licence'
            interfacePath: document.location.origin + "/interface.html", // This is optional if your application lives under a subdomain.
            scannerInterface: K1WebTwain.Options.ScannerInterface.Desktop,
            scanButton: $("#scanbtn"), // the scan button
        };

        K1WebTwain.Configure(configuration).then(() => {
            this.setState({ 
                isDisplayUI: false,
            });

            K1WebTwain.ResetService().then(function () {
                //setTimeout(() => {
                    self.renderSelection();
                    self.setState({ 
                        isDisplayUI: true,
                    });
                //}, 4000)
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
            let mappedSaveToTypeOptions = convertRawOptions(K1WebTwain.Options.SaveToType, true);
            
            this.setState({
                discoveredDevices: renderOptions(mappedDevices),
                ocrOptions: renderOptions(mappedOcrTypes),
                fileTypeOptions: renderOptions(mappedFileTypeOptions),
                saveToTypeOptions: renderOptions(mappedSaveToTypeOptions),
                outputFilename: generateScanFileName()
            });
        }).catch(err => {
            console.error(err);
        });
    }

    onDeviceChange(e) {
        let device = e.target.value;
        this.setState({
            isDisableScanButton: device.id === -1,
            selectedDevice: device
        })
    }

    handleAcquireClick() {
        this.setState({
            isDisplayUI: false
        })

        let acquireRequest = {
            deviceId: this.state.selectedDevice,
            filetype: this.state.selectedFileTypeOption,
            ocrType: this.state.selectedOcrOption,
            filename: this.state.outputFilename,
            saveToType: this.state.selectedSaveToOption,
        };

        K1WebTwain.Acquire(acquireRequest)
            .then(response => {
                let responseMessage = response.uploadResponse;

                if (this.state.selectedSaveToOption === K1WebTwain.Options.SaveToType.Local) {
                    responseMessage = {
                        filename: response.filename,
                        fileSize: `${response.fileLength} (${response.sizeDisplay})`,
                        fileExtension: response.extension
                    };
                }

                this.props.completeAcquire({
                    acquireResponse: JSON.stringify(responseMessage, null, 4),
                    acquireError: '',
                    saveToType: this.state.selectedSaveToOption
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
        return (
            this.state.isDisplayUI &&
            <div id="k1interface-hidden" className="show">
                <div>
                    <div id="device-group" className="twain-feature-group">
                        <label className="scanning-label">Device</label>
                            <select id="sel-scanner" className="form-control" value={this.state.selectedDevice} onChange={e => this.setState({
                                selectedDevice: e.target.value,
                                isDisableScanButton: parseInt(e.target.value) === -1
                            })}>
                            {this.state.discoveredDevices.map((device) => <option key={device.value} value={device.value}>{device.display}</option>)}
                        </select>
                    </div>

                    <label className="scanning-label mt-2">Output File Name</label>
                    <input id="sel-output-name" className="form-control" type="text" value={this.state.outputFilename} placeholder="Please enter a file name" onChange={e => this.setState({ outputFilename: e.target.value })} />

                    <label className="scanning-label mt-2">Output File Type</label>
                    <select id="sel-output" className="form-control" value={this.state.selectedFileTypeOption} onChange={e => this.setState({ selectedFileTypeOption: e.target.value })}>
                        {this.state.fileTypeOptions.map((device) => <option key={device.value} value={device.value}>{device.display}</option>)}
                    </select>

                    <label className="scanning-label mt-2">OCR Type</label>
                    <select id="sel-ocr-type" className="form-control" value={this.state.selectedOcrOption} onChange={e => this.setState({ selectedOcrOption: e.target.value })}>
                        {this.state.ocrOptions.map((device) => <option key={device.value} value={device.value}>{device.display}</option>)}
                    </select>

                    <label className="scanning-label mt-2">Save To</label>
                    <select id="sel-save-to" className="form-control" value={this.state.selectedSaveToOption} onChange={e => this.setState({ selectedSaveToOption: parseInt(e.target.value) })}>
                        {this.state.saveToTypeOptions.map((type) => <option key={type.value} value={type.value}>{type.display}</option>)}
                    </select>

                    <br />

                    <div className="input-group">
                        <div className="input-group-btn">
                                <button id="btn-acquire" type="button" className="btn btn-primary" aria-label="Bold" onClick={this.handleAcquireClick} disabled={this.state.isDisableScanButton}>
                                <span>Scan</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
