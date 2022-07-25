import React, { Component } from 'react';
import { K1WebTwain } from '../lib/k1scanservice/js/k1ss_obfuscated.js';

export class ScanCompleted extends Component {
    constructor(props) {
        super(props);
    }

    downloadDocument() {
        K1WebTwain.SPADownloadDocument();
    }

    render() {
        return (
            <div className="alert alert-success" id="uploadResponseDiv">
                <div>
                    <label className='scanning-label'>Response from file upload route:</label>
                </div>
                <pre id="uploadResponseOutput">
                    {this.props.message}
                </pre>
                <div className="input-group-btn fileview">
                    <button id="viewBtn2" type="button" className="btn btn-default k1ViewBtn" onClick={this.downloadDocument}>View</button>
                </div>
            </div>
        );
    }
}
