import React, { Component } from 'react';
import { ScannerInterfaceOptions } from './ScannerInterfaceOptions';

export class Home extends Component {
    static displayName = Home.name;

    render() {
        return (
            <div>
                <div><h1 className='mt-3'>Scan Demo Page: React</h1></div>
                <div className="alert alert-info alert-dismissible show" role="alert">
                    <strong>Note: </strong>The demonstration service has the following limitations;
                    - generated documents contain a watermark,
                    - multi-page documents are limited to 10 pages,
                    - OCR is limited to the first page of the document.
                    These limitations are not present in the licensed product.
                </div>
                <div>
                    <ScannerInterfaceOptions />
                </div>
            </div>
        );
    }
}
