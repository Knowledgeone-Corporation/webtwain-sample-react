import React, { Component } from 'react';
import $ from 'jquery';
import { K1WebTwain } from '../lib/k1scanservice/js/k1ss_obfuscated.js';
import { convertRawOptions, generateScanFileName, renderOptions } from '../utils/scanningUtils.js';

export class ScannerInterfaceDesktop extends Component {
    constructor(props) {
        super(props);
        this.state = {
            discoveredDevices: [],
            selectedDevice: 0,
            ocrOptions: [],
            selectedOcrOption: K1WebTwain.Options.OcrType.None,
            fileTypeOptions: [],
            selectedFileTypeOption: K1WebTwain.Options.OutputFiletype.PDF,
            outputFilename: '',
            isDisplayUI: false
        };
        this.handleAcquireClick = this.handleAcquireClick.bind(this);
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
            scannerInterface: K1WebTwain.Options.ScannerInterface.Desktop,
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
        }).catch(err => {
            console.error(err);
        });
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
        };

        K1WebTwain.Acquire(acquireRequest)
            .then(response => {
                this.props.completeAcquire({
                    acquireResponse: JSON.stringify(response.uploadResponse, null, 4),
                    acquireError: '',
                });
            })
            .catch(err => {
                console.error(err);
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
            });
    }

    render() {
        return (
            this.state.isDisplayUI &&
            <div id="k1interface-hidden" className="show">
                <div>
                    <div id="device-group" className="twain-feature-group">
                        <label className="scanning-label">Device</label>
                        <select id="sel-scanner" className="form-control" value={this.state.selectedDevice} onChange={e => this.setState({ selectedDevice: e.target.value })}>
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
