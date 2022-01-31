import React, { Component } from 'react';
import $ from 'jquery';
import { K1WebTwain } from '../lib/k1scanservice/js/k1ss_framework.js';
import { ScanError } from './ScanError';
import { ScanCompleted } from './ScanCompleted';
import '../lib/k1scanservice/css/k1ss.min.css';

export class ScannerInterfaceDesktop extends Component {
    constructor(props) {
        super(props);
        this.state = {
            discoveredDevices: [],
            selectedDevice: -1,
            ocrOptions: [],
            selectedOcrOption: -1,
            fileTypeOptions: [],
            selectedFileTypeOption: -1,
            outputFilename: "",
            acquireResponse: null,
            acquireError: null,
        };
        this.handleAcquireClick = this.handleAcquireClick.bind(this);
    }

    componentDidMount() {
        console.log("ScannerInterfaceDesktop");
        let configuration = {
            onComplete: function () { }, //function called when scan complete
            viewButton: $(".k1ViewBtn"), //This is optional. Specify a element that when clicked will view scanned document
            fileUploadURL: document.location.origin + '/Home/UploadFile', //This is the service that the scanned document will be uploaded to when complete
            clientID: "" + Date.now(), //This is a way to identify the user who is scanning.  It should be unique per user.  Session ID could be used if no user logged in
            setupFile: document.location.origin + '/Home/DownloadSetup', //location of the installation file if service doesn't yet exist
            interfacePath: document.location.origin + "/interface.html", // This is optional if your application lives under a subdomain.
            scannerInterface: K1WebTwain.Options.ScannerInterface.Desktop,
            scanButton: $("#scanbtn"), // the scan button
        };

        K1WebTwain.Configure(configuration).then(x => {
            K1WebTwain.GetDevices().then(devices => {
                console.log(devices);
                let mappedDevices = devices.map(device => {
                    return { value: device.id, display: device.name };
                });

                let mappedOcrTypes = Object.keys(K1WebTwain.Options.OcrType).map((key) => {
                    return { value: K1WebTwain.Options.OcrType[key], display: key };
                });

                let mappedFileTypeOptions = Object.keys(K1WebTwain.Options.OutputFiletype).map((key) => {
                    return { value: K1WebTwain.Options.OutputFiletype[key], display: key };
                });

                this.setState({
                    discoveredDevices: [{ value: -1, display: "Please Select" }].concat(mappedDevices),
                    ocrOptions: [{ value: -1, display: "Please Select" }].concat(mappedOcrTypes),
                    fileTypeOptions: [{ value: -1, display: "Please Select" }].concat(mappedFileTypeOptions),
                });
            }).catch(err => {
                console.error(err);
            });
        }).catch(x => {
            console.log(x);
        });
    }

    handleAcquireClick() {
        this.setState({
            acquireResponse: null,
            acquireError: null,
        });

        let acquireRequest = {
            deviceId: this.state.selectedDevice,
            filetype: this.state.selectedFileTypeOption,
            ocrType: this.state.selectedOcrOption,
            filename: this.state.outputFilename,
        };

        console.log(acquireRequest);

        K1WebTwain.Acquire(acquireRequest)
            .then(response => {
                console.log(response);
                this.setState({
                    acquireResponse: response,
                });
            })
            .catch(err => {
                console.error(err);
                let myError = null;

                if (!!err.responseText) {
                    myError = err.responseText;
                }

                if (!!err.responseJSON) {
                    try {
                        myError = JSON.stringify(err.responseJSON, null, 4);
                    }
                    catch (e) {
                        console.warn(e);
                    }
                }

                this.setState({
                    acquireError: myError,
                });
            });
    }

    render() {
        let successPanel = this.state.acquireResponse !== null ? <ScanCompleted message={JSON.stringify(this.state.acquireResponse, null, 4)} /> : "";
        let errorPanel = this.state.acquireError !== null ? <ScanError message={this.state.acquireError} /> : "";


        let filesizePanel = this.state.acquireResponse !== null ? <span className="input-group-addon filesize">{this.state.acquireResponse.sizeDisplay}</span> : "";

        let viewButton = this.state.acquireResponse !== null ? <div className="input-group-btn fileview">
            <button id="viewBtn2" type="button" className="btn btn-default k1ViewBtn">View</button>
        </div> : "";

        return (
            <div id="k1interface-hidden" className="show">
                <div>
                    <div id="device-group" className="twain-feature-group">
                        <label>Device</label>
                        <select id="sel-scanner" className="form-control" value={this.state.selectedDevice} onChange={e => this.setState({ selectedDevice: e.target.value })}>
                            {this.state.discoveredDevices.map((device) => <option key={device.value} value={device.value}>{device.display}</option>)}
                        </select>
                    </div>

                    <label>Output File Name</label>
                    <input id="sel-output-name" className="form-control" type="text" placeholder="Please enter a file name" onChange={e => this.setState({ outputFilename: e.target.value })} />

                    <label>Output File Type</label>
                    <select id="sel-output" className="form-control" value={this.state.selectedFileTypeOption} onChange={e => this.setState({ selectedFileTypeOption: e.target.value })}>
                        {this.state.fileTypeOptions.map((device) => <option key={device.value} value={device.value}>{device.display}</option>)}
                    </select>

                    <label>OCR Type</label>
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
                        <input className="form-control filename" aria-label="Text input with multiple buttons" />
                        {filesizePanel}
                        {viewButton}
                    </div>
                </div>

                <br />

                {successPanel}
                {errorPanel}
            </div>
        );
    }
}
