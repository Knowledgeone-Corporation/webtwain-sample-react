import React, { Component } from 'react';
import { ScannerInterfaceVisible } from './ScannerInterfaceVisible';
import { ScannerInterfaceWeb } from './ScannerInterfaceWeb';
import { ScannerInterfaceHidden } from './ScannerInterfaceHidden';
import { ScannerInterfaceDesktop } from './ScannerInterfaceDesktop';

export class ScannerInterfaceOptions extends Component {
    constructor(props) {
        super(props);
        this.state = { selectedInterface: -1 };
        this.handleInterfaceChange = this.handleInterfaceChange.bind(this);
    }

    handleInterfaceChange(val) {
        this.setState({ selectedInterface: val.target.value });
    }

    render() {
        var componentToRender;
        var selectedInterface = parseInt(this.state.selectedInterface);        
        switch (selectedInterface) {
            case 0:
                componentToRender = <ScannerInterfaceHidden />;
                break;
            case 1:
                componentToRender = <ScannerInterfaceVisible />;
                break;
            case 2:
                componentToRender = <ScannerInterfaceWeb />;
                break;
            case 3:
                componentToRender = <ScannerInterfaceDesktop />;
                break;
            default:
                componentToRender = "";
        }

        return (
            <div>
                <div className="form-group">
                    <label>Interface Option</label>
                    <div>
                        <select id="interface-option-dropdown" onChange={this.handleInterfaceChange} className="form-control">
                            <option>Please select...</option>
                            <option value="0">Hidden</option>
                            <option value="1">Visible</option>
                            <option value="2">Web</option>
                            <option value="3">Desktop</option>
                        </select>
                    </div>
                </div>
                {componentToRender}
            </div>
        );
    }
}
