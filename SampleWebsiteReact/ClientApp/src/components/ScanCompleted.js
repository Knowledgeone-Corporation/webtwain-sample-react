import React, { Component } from 'react';

export class ScanCompleted extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="alert alert-success" id="uploadResponseDiv">
                <div>
                    <label>Response from file upload route:</label>
                </div>
                <pre id="uploadResponseOutput">
                    {this.props.message}
                </pre>
            </div>
        );
    }
}
