// CustomDialog.js
import React from 'react';

export default function CustomDialog({ title, onClose }) {
    return (
        <div className="custom-dialog">
            <div className="dialog-header">
                <h2>{title}</h2>
                <button className="close-button" onClick={onClose}>
                    Close
                </button>
            </div>
            <div className="dialog-content">here will go the content</div>
        </div>
    );
}
