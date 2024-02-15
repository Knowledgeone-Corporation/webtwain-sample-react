import React, { Component } from 'react';
import { isEmpty } from 'lodash';

import { ScannerInterfaceVisible } from './ScannerInterfaceVisible';
import { ScannerInterfaceWeb } from './ScannerInterfaceWeb';
import { ScannerInterfaceHidden } from './ScannerInterfaceHidden';
import { ScannerInterfaceDesktop } from './ScannerInterfaceDesktop';
import { ScanCompleted } from './ScanCompleted';
import { ScanError } from './ScanError';

import '../lib/k1scanservice/css/k1ss.min.css';
import { K1WebTwain } from '../lib/k1scanservice/js/k1ss';

export class ScannerInterfaceOptions extends Component {
    constructor(props) {
        super(props);
        this.state = { 
            selectedInterface: -1,
            acquireResponse: '',
            acquireError: '',
            saveToType: K1WebTwain.Options.SaveToType.Upload
         };
        this.handleInterfaceChange = this.handleInterfaceChange.bind(this);
        this.completeAcquire = this.completeAcquire.bind(this);
    }

    handleInterfaceChange(val) {
        this.setState({ 
            selectedInterface: val.target.value,
            acquireResponse: '',
            acquireError: '',
            saveToType: K1WebTwain.Options.SaveToType.Upload
        });
    }

    completeAcquire(event) {
        this.setState({ 
            selectedInterface: -1,
            acquireResponse: event.acquireResponse,
            acquireError: event.acquireError,
            saveToType: event.saveToType ?? K1WebTwain.Options.SaveToType.Upload
         });
    }

    render() {
        let componentToRender;
        let selectedInterface = parseInt(this.state.selectedInterface);
        let successPanel = !isEmpty(this.state.acquireResponse) ? <ScanCompleted message={this.state.acquireResponse} saveToType={this.state.saveToType} /> : '';
        let errorPanel =  !isEmpty(this.state.acquireError) ? <ScanError message={this.state.acquireError} /> : '';  

        switch (selectedInterface) {
            case 0:
                componentToRender = <ScannerInterfaceHidden completeAcquire={this.completeAcquire}/>;
                break;
            case 1:
                componentToRender = <ScannerInterfaceVisible completeAcquire={this.completeAcquire}/>;
                break;
            case 2:
                componentToRender = <ScannerInterfaceWeb completeAcquire={this.completeAcquire}/>;
                break;
            case 3:
                componentToRender = <ScannerInterfaceDesktop completeAcquire={this.completeAcquire}/>;
                break;
            default:
                componentToRender = <>{successPanel}{errorPanel}</>;
                break;
        }

        return (
            <div>
                <div className="form-group">
                    <label className="scanning-label">Interface Option</label>
                    <div>
                        <select id="interface-option-dropdown" value={selectedInterface} onChange={this.handleInterfaceChange} className="form-control">
                            <option value="-1">Please select...</option>
                            <option value="0">Hidden : Not using Webtwain or Native UI</option>
                            <option value="1">Visible : Uses Webtwain and Native UI</option>
                            <option value="2">Web : only uses Webtwain UI</option>
                            <option value="3">Desktop : only uses Native scanner UI</option>
                        </select>
                    </div>
                </div>
                {componentToRender}
            </div>
        );
    }
}
