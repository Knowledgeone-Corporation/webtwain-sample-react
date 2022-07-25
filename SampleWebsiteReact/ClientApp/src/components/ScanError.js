import React, { Component } from 'react';

export class ScanError extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="alert alert-danger" id="errorMessageDiv">
                <div>
                    <label className='scanning-label'>Error</label>
                </div>
                <pre id="errorMessageOutput">
                    {this.props.message}
                </pre>
            </div>
        );
    }
}
