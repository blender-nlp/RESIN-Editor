// EditableText.js
import React, { useEffect, useState } from "react";
import "./EditableText.css";

const EditableText = ({
    values,
    field,
    onSave,
    variant,
    onClick,
    id,
    index = -1,
    onTable = false,
    wdData,
    ...props
}) => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [value, setValue] = useState(values);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        setValue(values);
    }, [values]);


    const handleEditClick = () => {
        setIsEditMode(true);
    };

    const handleSaveClick = () => {
        setIsEditMode(false);
        onSave(value, field, index);
    };

    const handleChange = (event) => {
        setValue(event.target.value);
    };

    return (
        <div
            className={onTable ? "editable-text-on-table" : "editable-text"}
            onMouseEnter={() => {
                setIsHovered(true);
            }}
            onMouseLeave={() => {
                setIsHovered(false);
            }}
        >
            {!isEditMode && (
                <>
                    {variant === "h2" && <h2>{values}</h2>}
                    {variant === "p" && <p>{values}</p>}
                    {variant === "none" && <>{values}</>}
                    {variant === "h3" && <h3>{values}</h3>}
                    {variant === "span" && (
                        <span
                            key={id}
                            className="clickable-text"
                            onClick={() => onClick(id)}
                        >
                            {values}
                        </span>
                    )}
                    <button className="edit-button" onClick={handleEditClick}>
                        <i className="fa fa-pencil" />
                    </button>
                </>
            )}
            {isEditMode && (
                <>
                    <textarea
                        type="text"
                        value={value}
                        onChange={handleChange}
                        className="text-style"
                    />

                    <button className="save-button" onClick={handleSaveClick}>
                        <i className="fa fa-check" />
                    </button>
                </>
            )}
            {wdData && wdData.wd_node && isHovered && (
                <div className="wd-data">
                    <h4>{wdData.wd_label}</h4>
                    <p>{wdData.wd_description}</p>
                </div>
            )}
        </div>
    );
};

export default EditableText;
