import React, { Component } from 'react';
import { K1WebTwain } from '../lib/k1scanservice/js/k1ss.js';

export class ScanCompleted extends Component {
    downloadDocument() {
        K1WebTwain.SPADownloadDocument();
    }

    render() {
        return (
            <div className="alert alert-success" id="uploadResponseDiv">
                <div>
                    <label className='scanning-label'>{this.props.saveToType === K1WebTwain.Options.SaveToType.Upload ? "Response from file upload route:" : "File Info:"}</label>
                </div>
                <pre id="uploadResponseOutput">
                    {this.props.message}
                </pre>
                <div className="input-group-btn fileview">
                    <button id="viewBtn2" type="button" className="btn btn-default k1ViewBtn" onClick={this.downloadDocument}>{this.props.saveToType === K1WebTwain.Options.SaveToType.Upload ? "View" : "Download"}</button>
                </div>
            </div>
        );
    }
}
