import React, { memo } from "react";
import useStore from "../../TA2/store";
import "./EventGraphNode.css";

export const EventGraphNode = ({ id, data, isConnectable, onHover }) => {
    const node = useStore((state) => state.getNodeById)(id);
    if (!node) {
        return null;
    }

    return (
        <div className="eventnode">
            {node.render({}, isConnectable, onHover)}
        </div>
    );
};

export default memo(EventGraphNode);
