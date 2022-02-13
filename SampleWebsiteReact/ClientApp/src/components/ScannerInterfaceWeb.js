import React, { Component } from 'react';
import $ from 'jquery';
import { K1WebTwain } from '../lib/k1scanservice/js/k1ss_framework.js';
import { ScanError } from './ScanError';
import { ScanCompleted } from './ScanCompleted';
import '../lib/k1scanservice/css/k1ss.min.css';

export class ScannerInterfaceWeb extends Component {
    constructor(props) {
        super(props);
        this.state = {
            acquireResponse: null,
            acquireError: null,
        };
    }

    componentDidMount() {
        let self = this;
        console.log("ScannerInterfaceWeb");
        let configuration = {
            onComplete: function (data) {
                self.setState({
                    acquireResponse: data,
                });
            }, //function called when scan complete
            viewButton: $(".k1ViewBtn"), //This is optional. Specify a element that when clicked will view scanned document
            fileUploadURL: document.location.origin + '/Home/UploadFile', //This is the service that the scanned document will be uploaded to when complete
            clientID: "" + Date.now(), //This is a way to identify the user who is scanning.  It should be unique per user.  Session ID could be used if no user logged in
            setupFile: document.location.origin + '/Home/DownloadSetup', //location of the installation file if service doesn't yet exist
            interfacePath: document.location.origin + "/interface.html", // This is optional if your application lives under a subdomain.
            scannerInterface: K1WebTwain.Options.ScannerInterface.Web,
            scanButton: $("#scanbtn"), // the scan button
        };

        K1WebTwain.Configure(configuration).then(x => {
            console.log(x);
        }).catch(x => {
            console.log(x);
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
            <div id="k1interface-visible" className="show">

                <div><label>Scan Document:</label></div>
                <div className="input-group">
                    <div className="input-group-btn">
                        <button id="scanbtn" type="button" className="btn btn-primary" aria-label="Bold">
                            <span>Scan</span>
                        </button>
                    </div>
                    <input className="form-control filename" aria-label="Text input with multiple buttons" />
                    {filesizePanel}
                    {viewButton}
                </div>

                <br />

                {successPanel}
                {errorPanel}
            </div>
        );
    }
}
