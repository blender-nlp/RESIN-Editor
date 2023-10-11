import React, { useContext } from "react";
import { SchemaTypeContext } from "../../DataReadingComponents/DataReader";
import { TA1EventNodeInfoPanel } from "../../TA1/TA1EventNodeInfoPanel";
import { TA2EventNodeInfoPanel } from "../../TA2/TA2EventNodeInfoPanel";
import "./Panel.css";
export function InfoPanel({ data, onClose }) {
    const [schemaType] = useContext(SchemaTypeContext);
    if (data === undefined) {
        return <></>;
    }
    return schemaType === "ta2" ? (
        <TA2EventNodeInfoPanel data={data} onClose={onClose} />
    ) : (
        <TA1EventNodeInfoPanel data={data} onClose={onClose} />
    );
}
