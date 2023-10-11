import { JsonConvert } from "json2typescript";
import React, { useContext, useEffect, useState } from "react";
import ReactFlow, {
    Controls,
    MiniMap,
    NodeToolbar,
    Position,
    ReactFlowProvider,
    useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { RangeSlider } from "../../components/CustomizedComponents/RangeSlider/RangeSlider";
import {
    DataContext,
    EventsContext,
    SchemaTypeContext,
    nodeTypes,
} from "../../components/DataReadingComponents/DataReader";
import Menu from "../../components/PageComponents/Menu/Menu";
import { InfoPanel } from "../../components/PageComponents/Panel/Panel";
import { EventNode } from "../../components/TA2/Library";
import { TA2EditEventPanel } from "../../components/TA2/TA2EditEventPanel";
import useStore from "../../components/TA2/store";
import TA2DownloadSubgraph from "../../components/TA2/TA2DownloadSubgraph";
import "./graph.css";

export const Graph = () => {
    const [eventNodes] = useContext(EventsContext);
    const [schemaType] = useContext(SchemaTypeContext);
    const {
        nodes,
        edges,
        mapNodes,
        clickedNode,
        contextMenu,
        confidenceInterval,
        showAddPanel,
        deltaX,
        deltaY,
        selectionNodes,
        selectionContextMenu,
        firstNode,
        paneContextMenu,
        setShowAddPanel,
        setClickedNode,
        setContextMenu,
        setPaneContextMenu,
        onNodesChange,
        onEdgesChange,
        updateGraphByEventNodes,
        onNodeClick,
        onConnect,
        onEdgeUpdate,
        onPaneContextMenu,
        onSelectionContextMenu,
        onNodesDelete,
        onSelectionChange,
        setConfidenceInterval,
    } = useStore();

    const handleClosePanel = () => {
        setClickedNode(null);
        setShowAddPanel(null);
        setContextMenu(null);
        setPaneContextMenu(null);
    };

    const [jsonData] = useContext(DataContext);

    // layout related functions
    useEffect(() => {
        if (
            schemaType !== "ta2" ||
            !eventNodes ||
            eventNodes.length === 0 ||
            !(eventNodes[0] instanceof EventNode)
        )
            return;
        updateGraphByEventNodes(eventNodes);
    }, [eventNodes]);

    const [grouping, setGrouping] = useState(false);
    const [addInPanel, setAddInPanel] = useState(false);
    // useEffect(() => {
    //     console.log("deltaX, deltaY", deltaX, deltaY);
    //     setCenter(getViewPort().x + deltaX, getViewPort().y + deltaY);
    // }, [deltaX, deltaY]);

    // denote the color of the node in the minimap
    const nodeColor = (node) => node.data.color;

    return (
        <div className="layoutflow">
            <ReactFlowProvider>
                <NewPanel deltaX={deltaX} deltaY={deltaY} />
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    multiSelectionKeyCode={"Ctrl"}
                    onSelectionChange={onSelectionChange}
                    onNodeContextMenu={(event, node) => {
                        event.preventDefault();
                        setContextMenu(node);
                        setPaneContextMenu(null);
                    }}
                    onPaneClick={() => {
                        setClickedNode(null);
                        setContextMenu(null);
                        setPaneContextMenu(null);
                        setShowAddPanel(null);
                    }}
                    onSelectionContextMenu={onSelectionContextMenu}
                    nodeTypes={nodeTypes}
                    onConnect={onConnect}
                    onEdgeUpdate={onEdgeUpdate}
                    onNodesDelete={onNodesDelete}
                    onPaneContextMenu={onPaneContextMenu}
                    maxZoom={2}
                    minZoom={0.1}
                    fitView
                />
                <MiniMap
                    nodes={nodes}
                    edges={edges}
                    nodeColor={nodeColor}
                    nodeStrokeWidth={3}
                    zoomable
                    pannable
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: 10,
                        left: 70,
                        width: 300,
                    }}
                >
                    <RangeSlider
                        initialValue={confidenceInterval}
                        onValueChange={setConfidenceInterval}
                    />
                </div>
                <Controls />
                {clickedNode && (
                    <>
                        <InfoPanel
                            data={
                                clickedNode.data.isGate
                                    ? mapNodes.get(
                                          clickedNode.data.referredNode
                                      )
                                    : mapNodes.get(clickedNode.id)
                            }
                            onClose={handleClosePanel}
                        />
                    </>
                )}
                {contextMenu && (
                    <NodeToolbar
                        nodeId={contextMenu.id}
                        position={Position.Bottom}
                        isVisible={true}
                    >
                        <button
                            className="selection-button"
                            onClick={() => {
                                onNodesDelete([mapNodes.get(contextMenu.id)]);
                                setContextMenu(null);
                                setPaneContextMenu(null);
                                setClickedNode(null);
                                setShowAddPanel(null);
                                setGrouping(false);
                                setAddInPanel(false);
                            }}
                        >
                            <span className="fa fa-trash-o" />
                        </button>
                        <button
                            className="selection-button"
                            onClick={() => {
                                setClickedNode(contextMenu);
                                setShowAddPanel(
                                    contextMenu.data.isGate
                                        ? contextMenu.data.referredNode
                                        : contextMenu.id
                                );
                            }}
                        >
                            <span className="fa fa-plus" />
                        </button>
                        {contextMenu.id !== firstNode &&
                            !contextMenu.id.startsWith("gate-") && (
                                <TA2DownloadSubgraph
                                    nodeId={contextMenu.id}
                                    onClick={() => {
                                        setContextMenu(null);
                                        setPaneContextMenu(null);
                                        setClickedNode(null);
                                        setShowAddPanel(null);
                                        setGrouping(false);
                                        setAddInPanel(false);
                                    }}
                                />
                            )}
                        {contextMenu.id !== firstNode &&
                            !contextMenu.id.startsWith("gate-") && (
                                <button
                                    className="selection-button"
                                    onClick={() => {
                                        setClickedNode(contextMenu);
                                        setGrouping(true);
                                        const parentId = contextMenu.parentNode;
                                        setShowAddPanel(
                                            parentId === null ||
                                                parentId === undefined
                                                ? "null"
                                                : parentId.startsWith("gate-")
                                                ? parentId.replace("gate-", "")
                                                : parentId
                                        );
                                    }}
                                >
                                    <span className="fa fa-object-group" />
                                </button>
                            )}
                    </NodeToolbar>
                )}
                {selectionContextMenu && selectionNodes.length > 0 && (
                    <NodeToolbar
                        nodeId={selectionNodes.map((node) => node.id)}
                        position={Position.Bottom}
                        isVisible={true}
                    >
                        <button
                            className="selection-button"
                            onClick={() => {
                                onNodesDelete(selectionNodes);
                                setContextMenu(null);
                                setClickedNode(null);
                                setGrouping(false);
                                setPaneContextMenu(null);
                                setAddInPanel(false);
                                setShowAddPanel(null);
                            }}
                        >
                            <span className="fa fa-trash-o" />
                        </button>
                        <button
                            className="selection-button"
                            onClick={() => {
                                const parentId = selectionNodes.reduce(
                                    (acc, node) => {
                                        if (node.parentNode === acc) {
                                            return node.parentNode;
                                        } else {
                                            return null;
                                        }
                                    },
                                    selectionNodes[0].parentNode
                                );
                                console.log("parentId", parentId);
                                setClickedNode(selectionNodes[0]);
                                setGrouping(true);
                                setShowAddPanel(
                                    parentId === null
                                        ? "null"
                                        : parentId.startsWith("gate-")
                                        ? parentId.replace("gate-", "")
                                        : parentId
                                );
                            }}
                        >
                            <span className="fa fa-object-group" />
                        </button>
                    </NodeToolbar>
                )}
                {paneContextMenu && (
                    <div
                        style={{
                            position: "fixed",
                            left: paneContextMenu.clientX - 50,
                            top: paneContextMenu.clientY,
                            width: 100,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <button
                            className="selection-button"
                            onClick={() => {
                                setClickedNode(null);
                                setContextMenu(null);
                                setPaneContextMenu(null);
                                setShowAddPanel("null");
                            }}
                        >
                            <span className="fa fa-plus" />
                        </button>
                    </div>
                )}
                {showAddPanel && (
                    <TA2EditEventPanel
                        parentId={showAddPanel}
                        onClose={() => {
                            setGrouping(false);
                            setAddInPanel(false);
                            setShowAddPanel(null);
                            setClickedNode(null);
                        }}
                        subgroupEvents={
                            selectionNodes.length > 0
                                ? selectionNodes.map((node) => node.id) || []
                                : clickedNode
                                ? [clickedNode.id]
                                : []
                        }
                        grouping={grouping}
                        addInPanel={addInPanel}
                    />
                )}
            </ReactFlowProvider>
            <Menu />
        </div>
    );
};
const NewPanel = ({ deltaX, deltaY }) => {
    const { setViewport, getViewport } = useReactFlow((instance) => instance);
    useEffect(() => {
        const { x, y, zoom } = getViewport();

        setViewport(
            { x: x + deltaX * zoom, y: y + deltaY * zoom, zoom: zoom },
            { duration: 0 }
        );
    }, [deltaX]);
    return null;
};

export default Graph;
