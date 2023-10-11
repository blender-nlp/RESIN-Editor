import React, { memo } from "react";
import useStore from "../../TA1/storeTA1";
import "./CustomNode.css";

export const CustomNode = ({ id, data, isConnectable, onHover }) => {
    const objectId = data && data.isEntity === true? id.substring(0, id.indexOf('-')):id
    const node = useStore((state) => state.getNodeById)(objectId);
    if (!node) {
        return null;
    }
    return (
        <div className="eventnode">
            {node.render(isConnectable)}
        </div>
    );
};

export default memo(CustomNode);
