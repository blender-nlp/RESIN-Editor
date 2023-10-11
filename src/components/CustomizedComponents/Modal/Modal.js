import {
    faClose,
    faCompress,
    faEdit,
    faExpand
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

export function Modal({ isEnlarged, toggleEnlarged, handleClick, handleEdit }) {
    return (
        <div className="modal">
            {handleEdit && (
                <FontAwesomeIcon
                    icon={faEdit}
                    className="edit-button"
                    onClick={handleEdit} />
            )}
            <FontAwesomeIcon
                icon={isEnlarged ? faCompress : faExpand}
                className="enlarge-button"
                onClick={toggleEnlarged} />
            <FontAwesomeIcon
                icon={faClose}
                className="exit-button"
                onClick={handleClick} />
        </div>
    );
}
