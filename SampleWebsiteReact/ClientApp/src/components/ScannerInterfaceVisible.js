import React, { Component } from 'react';
import $ from 'jquery';
import { K1WebTwain } from '../lib/k1scanservice/js/k1ss_obfuscated.js';

export class ScannerInterfaceVisible extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isDisplayUI: false,
        };
    }

    componentDidMount() {
        let self = this;
        let configuration = {
            onComplete: function (response) {
                self.props.completeAcquire({
                    acquireResponse: JSON.stringify(response.uploadResponse, null, 4),
                    acquireError: '',
                });
            }, //function called when scan complete
            viewButton: null, //This is optional. Specify a element that when clicked will view scanned document
            fileUploadURL: document.location.origin + '/Home/UploadFile', //This is the service that the scanned document will be uploaded to when complete
            clientID: "" + Date.now(), //This is a way to identify the user who is scanning.  It should be unique per user.  Session ID could be used if no user logged in
            setupFile: document.location.origin + '/Home/DownloadSetup', //location of the installation file if service doesn't yet exist
            interfacePath: document.location.origin + "/interface.html", // This is optional if your application lives under a subdomain.
            scannerInterface: K1WebTwain.Options.ScannerInterface.Visible,
            scanButton: $("#scanbtn"), // the scan button
        };

        K1WebTwain.Configure(configuration).then(() => {
            this.setState({ 
                isDisplayUI: false,
            });

            K1WebTwain.ResetService().then(function () {
                setTimeout(() => {
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

    render() {
        return (
            <div id="k1interface-visible" className={this.state.isDisplayUI ? "show" : "hide"}>
                <div><label className="scanning-label">Scan Document:</label></div>
                <div className="input-group">
                    <div className="input-group-btn">
                        <button id="scanbtn" type="button" className="btn btn-primary" aria-label="Bold">
                            <span>Scan</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}
