import {
    Connection,
    ConnectionLineType,
    Edge,
    EdgeChange,
    MarkerType,
    Node,
    NodeChange,
    OnConnect,
    OnEdgesChange,
    OnNodesChange,
    OnSelectionChangeParams,
    Position,
    applyEdgeChanges,
    applyNodeChanges,
} from "reactflow";
import { create } from "zustand";
import getLayoutedElementsNested from "../../pages/TA2/layout";
import {
    DetectedNodeStrategy,
    EventNode,
    EventNodeType,
    NodeRenderingStrategy,
    PredictedNodeStrategy,
    SourceOnlyNodeStrategy,
} from "./Library";

enum GraphEdgeType {
    or = "or",
    xor = "xor",
    and = "and",
    outlink = "outlink",
}

type EdgeStyle = {
    [key in GraphEdgeType]: {
        animated: boolean;
        type: ConnectionLineType;
        zIndex: number;
        style: {
            stroke: string;
            strokeWidth: number;
            strokeDasharray: string;
        };
        markerEnd?: {
            type: MarkerType;
            size: number;
            color: string;
        };
        labelStyle?: {
            fill: string;
            fontWeight: number;
            fontSize: number;
        };
        width?: number;
    };
};
type RFState = {
    nodes: Node[];
    edges: Edge[];
    chosenNodes: string[];
    confidenceInterval: [number, number];
    chosenEntities: string[];
    entityChosenEvents: Set<string>;
    entitiesRelatedEventMap: Map<string, string[]>;
    mapNodes: Map<string, any>;
    showAddPanel: string | null;
    contextMenu: Node | null;
    clickedNode: Node | null;
    firstNode: string | null;
    selectionContextMenu: boolean;
    paneContextMenu: object | null;
    selectionNodes: Node[];
    edgeStyle: EdgeStyle;
    key: number;
    deltaX: number;
    deltaY: number;
    onPaneContextMenu?:
        | ((event: React.MouseEvent<Element, MouseEvent>) => void)
        | undefined;
    setConfidenceInterval: (confidenceInterval: [number, number]) => void;
    setEdges: (edges: Edge[]) => void;
    setNodes: (nodes: Node[]) => void;
    editMapNode: (
        nodeId: string,
        field: string,
        value: any,
        index: number
    ) => void;
    nodeRerender: (typeNode: string) => void;
    setChosenEntities: (chosenEntities: string[]) => void;
    setChosenNodes: (chosenNodes: string[]) => void;
    setMapNodes: (mapNodes: Map<string, any>) => void;
    setShowAddPanel: (showAddPanel: string) => void;
    setSelectionContextMenu: (selectionContextMenu: boolean) => void;
    setPaneContextMenu: (paneContextMenu: object | null) => void;
    setContextMenu: (contextMenu: Node | null) => void;
    setClickedNode: (clickedNode: Node | null) => void;
    setFirstNode: (firstNode: string | null) => void;
    setEntityChosenEvents: (entityChosenEvents: []) => void;
    addNodeOnPanel: (node: EventNode) => void;
    addEventNode: (node: EventNode, grouping: boolean) => void;
    getNewIdInEventMap: () => string;
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onNodesDelete: (nodes: Node[]) => void;
    getEntitiesRelatedEventMap: () => Map<string, string[]>;
    onConnect: OnConnect;
    onSelectionContextMenu: (event: React.MouseEvent, nodes: Node[]) => void;
    onEdgeUpdate: (oldEdge: Edge, newConnection: Connection) => void;
    onSelectionChange: (params: OnSelectionChangeParams) => void;
    onNodeClick: (event: any, node: Node) => void;
    updateNodeAttribute: (
        nodeType: EventNodeType,
        key: string,
        value: string
    ) => void;
    updateEdgeAttribute: (
        edgeType: GraphEdgeType,
        key: string,
        body: any
    ) => void;
    updateTreeNodeAttribute: (key: string, value: string) => void;
    updateEdgeStyle: (edgeType: GraphEdgeType, style: any) => void;
    refreshGate: (gateType: GraphEdgeType) => void;
    updateGraphByEventNodes: (eventNodes: EventNode[]) => void;
    getAllCurrentSubgroupEvents: (node: string) => string[];
    getNodeById: (id: string) => Node | undefined;
    updateLayout: () => void;
};

// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useStore = create<RFState>((set, get) => ({
    nodes: [],
    edges: [],
    chosenNodes: [],
    chosenEntities: [],
    mapNodes: new Map(),
    entityChosenEvents: new Set(),
    entitiesRelatedEventMap: new Map(),
    showAddPanel: null,
    contextMenu: null,
    clickedNode: null,
    selectionContextMenu: false,
    paneContextMenu: null,
    firstNode: null,
    confidenceInterval: [0.0, 1.0],
    key: 0,
    deltaX: 0,
    deltaY: 0,
    selectionNodes: [],
    edgeStyle: {
        or: {
            data: {
                edgeType: "or",
            },
            childrenGate: "or",
            animated: false,
            type: ConnectionLineType.Straight,
            zIndex: 10,
            style: {
                stroke: "#C0C0C0",
                strokeWidth: 2,
                strokeDasharray: "none",
            },
        },
        xor: {
            data: {
                edgeType: "xor",
            },
            childrenGate: "xor",
            animated: false,
            type: ConnectionLineType.Straight,
            labelStyle: { fill: "#798223", fontWeight: 700, fontSize: 32 },
            width: 5,
            zIndex: 10,
            style: {
                stroke: "#798223",
                strokeDasharray: "4 1 2 3",
                strokeWidth: 5,
            },
        },
        and: {
            data: {
                edgeType: "and",
            },
            childrenGate: "and",
            animated: false,
            type: ConnectionLineType.Straight,
            labelStyle: { fill: "#009E73", fontWeight: 700, fontSize: 32 },
            width: 5,
            zIndex: 10,
            style: {
                stroke: "#009E73",
                strokeWidth: 5,
                strokeDasharray: "none",
            },
        },
        outlink: {
            data: {
                edgeType: "outlink",
            },
            animated: false,
            type: ConnectionLineType.Straight,
            zIndex: 10,
            labelStyle: { fill: "#798223", fontWeight: 700, fontSize: 32 },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                size: 20,
                color: "#9DA8AF",
            },
            width: 10,
            style: {
                stroke: "#9DA8AF",
                strokeWidth: 5,
                strokeDasharray: "none",
                zIndex: 10,
            },

            sourcePosition: Position.Right,
            targetPosition: Position.Left,
        },
    },
    setEdges: (edges: Edge[]) => {
        set({ edges });
    },
    setNodes: (nodes: Node[]) => {
        set({ nodes });
    },
    setChosenNodes: (chosenNodes) => {
        // console.log("chosenNodes", chosenNodes);
        set({ chosenNodes });
        get().updateLayout();
    },

    setEntityChosenEvents: (entityChosenEvents) => {
        const entityChosenEventsSet = new Set(entityChosenEvents);
        set({ entityChosenEvents: entityChosenEventsSet });
    },
    editMapNode: (
        nodeId: string,
        field: string,
        value: any,
        index: number = -1
    ) => {
        const { mapNodes, nodeRerender } = get();
        if (index === -1) {
            mapNodes.get(nodeId)[field] = value;
        } else {
            mapNodes.get(nodeId)[field][index] = value;
        }
        nodeRerender("eventNode");
    },
    setConfidenceInterval: (confidenceInterval) => {
        const { nodes, nodeRerender, entityChosenEvents } = get();
        nodes.forEach((node) => {
            const opacity =
                (entityChosenEvents.size === 0 ||
                    entityChosenEvents.has(node.id)) &&
                node.data.confidence >= confidenceInterval[0] &&
                node.data.confidence <= confidenceInterval[1]
                    ? 1
                    : 0.5;
            node.style = {
                ...node.style,
                opacity: opacity,
            };
        });
        set({ nodes, confidenceInterval });
        nodeRerender("eventNode");
    },

    addEventNode: (node: EventNode, grouping: Boolean = false) => {
        const { mapNodes, updateLayout } = get();
        console.log("subgroupEvent here here", node);
        mapNodes.set(node.id, node);
        const parentId = node.parent;
        if (parentId === undefined) {
            return;
        }
        if (grouping) {
            const subgroupEvents = node.subgroupEvents;
            const outlinks: string[] = [];
            console.log("node.subgroupEvents", node.subgroupEvents);

            subgroupEvents.forEach((subgroupEvent: string) => {
                const subgroupEventNode = mapNodes.get(subgroupEvent);
                console.log("subgroupEventNode", subgroupEventNode);
                subgroupEventNode.parent = node.id;
                outlinks.push(
                    ...subgroupEventNode.outlinks.filter(
                        (outlink: string) =>
                            !node.subgroupEvents.includes(outlink)
                    )
                );

                subgroupEventNode.outlinks = subgroupEventNode.outlinks.filter(
                    (outlink: string) => node.subgroupEvents.includes(outlink)
                );
            });
            node.outlinks = outlinks;

            const parentNode = mapNodes.get(parentId);
            if (parentNode) {
                parentNode.subgroupEvents = parentNode.subgroupEvents.filter(
                    (subgroupEvent: string) =>
                        !node.subgroupEvents.includes(subgroupEvent)
                );
                parentNode.subgroupEvents.push(node.id);
                parentNode.subgroupEvents.forEach((subgroupEvent: string) => {
                    const subgroupEventNode = mapNodes.get(subgroupEvent);
                    console.log("subgroupEventNode", subgroupEventNode);
                    if (subgroupEventNode.outlinks === undefined) {
                        return;
                    }
                    if (
                        subgroupEventNode.outlinks.filter((outlink: string) =>
                            subgroupEvents.includes(outlink)
                        ).length === 0
                    ) {
                        return;
                    }
                    subgroupEventNode.outlinks =
                        subgroupEventNode.outlinks.filter(
                            (outlink: string) =>
                                !subgroupEvents.includes(outlink)
                        );
                    subgroupEventNode.outlinks.push(node.id);
                });
            }
        }
        const parentNode = mapNodes.get(parentId);
        if (parentNode) {
            parentNode.subgroupEvents = parentNode.subgroupEvents
                ? [...parentNode.subgroupEvents, node.id]
                : [node.id];
            if (!parentNode.childrenGate) {
                parentNode.childrenGate = "or";
            }
        }
        console.log("parentNode", parentNode);
        updateLayout();
    },
    setMapNodes: (mapNodes) => {
        set({ mapNodes });
        get().getEntitiesRelatedEventMap();
    },
    setShowAddPanel: (showAddPanel) => set({ showAddPanel }),
    setClickedNode: (clickedNode) => set({ clickedNode }),
    setSelectionContextMenu: (selectionContextMenu) =>
        set({ selectionContextMenu }),
    setContextMenu: (contextMenu) => set({ contextMenu }),
    setFirstNode: (firstNode) => set({ firstNode }),
    setPaneContextMenu: (paneContextMenu) => set({ paneContextMenu }),
    setChosenEntities(chosenEntities) {
        const { nodes, confidenceInterval, nodeRerender } = get();
        const chosenEvents = new Set<string>();
        for (const entityName of chosenEntities) {
            const events = get().entitiesRelatedEventMap.get(entityName);
            if (events === undefined) {
                continue;
            }
            for (const event of events) {
                chosenEvents.add(event);
            }
        }
        console.log("chosenEvents", chosenEvents);
        nodes.forEach((node) => {
            const opacity =
                (chosenEvents.size === 0 || chosenEvents.has(node.id)) &&
                node.data.confidence >= confidenceInterval[0] &&
                node.data.confidence <= confidenceInterval[1]
                    ? 1
                    : 0.5;
            node.style = {
                ...node.style,
                opacity: opacity,
            };
        });

        set({ entityChosenEvents: chosenEvents, chosenEntities, nodes });
        nodeRerender("eventNode");
    },
    getNodeById: (id: string) => {
        return get().mapNodes.get(id);
    },
    groupingNodes(nodes: string[]) {},
    onNodesChange: (changes: NodeChange[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },
    onPaneContextMenu: (event) => {
        event.preventDefault();
        console.log("event", event);
        set({
            paneContextMenu: event,
            contextMenu: null,
            selectionContextMenu: false,
        });
    },
    onEdgesChange: (changes: EdgeChange[]) => {
        changes.forEach((change) => {
            if (change.type === "remove") {
                const { mapNodes } = get();
                const edgeId = change.id;
                const edge = get().edges.find((edge) => edge.id === edgeId);
                if (edge === undefined) {
                    return;
                }
                const sourceNode = mapNodes.get(edge.source);
                if (sourceNode) {
                    sourceNode.outlinks = sourceNode.outlinks.filter(
                        (outlink: string) => outlink !== edge.target
                    );
                }
            }
        });
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },
    updateNodeAttribute: (
        nodeType: EventNodeType,
        key: string,
        value: string
    ) => {
        if (nodeType === EventNodeType.Detected) {
            DetectedNodeStrategy.options = {
                ...DetectedNodeStrategy.options,
                [key]: value,
            };
        } else if (nodeType === EventNodeType.SourceOnly) {
            SourceOnlyNodeStrategy.options = {
                ...SourceOnlyNodeStrategy.options,
                [key]: value,
            };
        } else if (nodeType === EventNodeType.Predicted) {
            PredictedNodeStrategy.options = {
                ...PredictedNodeStrategy.options,
                [key]: value,
            };
        }
        get().nodeRerender("eventNode");
    },
    updateTreeNodeAttribute: (key: string, value: string) => {
        NodeRenderingStrategy.nodeOptions = {
            ...NodeRenderingStrategy.nodeOptions,
            [key]: value,
        };
        get().nodeRerender("eventNode");
    },

    updateGraphByEventNodes: (eventNodes: EventNode[]) => {
        if (eventNodes.length > 0) {
            const firstNode = eventNodes.find((node) => node.isTopLevel);
            const newMap = new Map();
            eventNodes.forEach((node) => {
                newMap.set(node.id, node);
            });

            set({
                mapNodes: newMap,
                firstNode: firstNode ? firstNode.id : null,
            });

            get().getEntitiesRelatedEventMap();
            get().setChosenNodes(firstNode ? [firstNode.id] : []);
        }
    },
    onSelectionChange: (params: OnSelectionChangeParams) => {
        const { nodes } = params;
        const newNodes = nodes.filter((q) => q.type === "eventNode");
        set({
            selectionNodes: newNodes,
            selectionContextMenu: false,
        });
    },
    updateEdgeStyle: (edgeType: GraphEdgeType, style: any) => {
        const { edgeStyle } = get();
        console.log("edgeType", edgeType);
        const newEdgeStyle = {
            ...edgeStyle,
            [edgeType]: {
                ...edgeStyle[edgeType],
                style: {
                    ...edgeStyle[edgeType].style,
                    ...style,
                },
            },
        };

        set({
            edgeStyle: newEdgeStyle,
            edges: get().edges.map((edge) => {
                if (edge.data.edgeType === edgeType) {
                    return {
                        ...edge,
                        data: {
                            ...edge.data,
                            key: Date.now(),
                        },
                        ...newEdgeStyle[edgeType],
                    };
                }
                return edge;
            }),
        });
    },
    getEntitiesRelatedEventMap: () => {
        const { mapNodes } = get();
        const entitiesRelatedEventMap = new Map();
        mapNodes.forEach((event, key) => {
            event.relatedEntities().forEach((entity: string) => {
                if (entitiesRelatedEventMap.has(entity)) {
                    entitiesRelatedEventMap.set(entity, [
                        ...entitiesRelatedEventMap.get(entity),
                        key,
                    ]);
                } else {
                    entitiesRelatedEventMap.set(entity, [key]);
                }
            });
        });
        // get rid of entity with only 1 event
        entitiesRelatedEventMap.forEach((value, key) => {
            if (value.length <= 1) {
                entitiesRelatedEventMap.delete(key);
            }
        });

        // sort the array by the number of events
        const sortedEntitiesRelatedEventMap = new Map(
            [...entitiesRelatedEventMap.entries()].sort((a, b) => {
                return b[1].length - a[1].length;
            })
        );
        set({ entitiesRelatedEventMap: sortedEntitiesRelatedEventMap });
        return sortedEntitiesRelatedEventMap;
    },
    onSelectionContextMenu: (event, nodes) => {
        console.log("nodes multiselect", nodes);
        event.preventDefault();
        set({
            selectionNodes: nodes,
            selectionContextMenu: true,
            paneContextMenu: null,
            contextMenu: null,
        });
    },
    addNodeOnPanel(node: EventNode) {
        // we add a new parent node to the root node of the graph, and change istoplevel of that node to false, then we add the new node and the old subnode as subgroupEvents of the new parent node
        const {
            mapNodes,
            firstNode,
            chosenNodes,
            updateLayout,
            getNewIdInEventMap,
        } = get();
        const newMapNodes = new Map(mapNodes);
        const newFirstNode = getNewIdInEventMap();
        if (firstNode === null) {
            return;
        }
        const FirstNodeObject = mapNodes.get(firstNode);
        const newFirstNodeObject = new EventNode(newFirstNode, "none", "");
        newFirstNodeObject.subgroupEvents = [firstNode, node.id];
        newFirstNodeObject.isTopLevel = true;
        newFirstNodeObject.parent = FirstNodeObject.parent;
        newFirstNodeObject.childrenGate = "or";
        newFirstNodeObject.confidence = [1.0];
        console.log("newFirstNodeObject", newFirstNodeObject);

        // set up the old firstnode
        FirstNodeObject.isTopLevel = false;
        FirstNodeObject.parent = newFirstNode;
        console.log("FirstNodeObject", FirstNodeObject);

        //set up the new node
        node.parent = newFirstNode;
        node.isTopLevel = false;
        console.log("node", node);

        newMapNodes.set(node.id, node);
        newMapNodes.set(firstNode, FirstNodeObject);
        newMapNodes.set(newFirstNode, newFirstNodeObject);
        set({
            mapNodes: newMapNodes,
            firstNode: newFirstNode,
            chosenNodes: [newFirstNode, ...chosenNodes],
        });

        console.log("newMapNodes", newMapNodes);
        console.log("chosenNodes", chosenNodes);
        console.log("firstNode", firstNode);
        updateLayout();
    },
    updateEdgeAttribute: (edgeType: GraphEdgeType, key: string, body: any) => {
        const { edgeStyle } = get();
        const newEdgeStyle = {
            ...edgeStyle,
            [edgeType]: {
                ...edgeStyle[edgeType],
                [key]: body,
            },
        };
        set({
            edgeStyle: newEdgeStyle,
            edges: get().edges.map((edge) => {
                if (edge.data.edgeType === edgeType) {
                    return {
                        ...edge,
                        data: {
                            ...edge.data,
                            key: Date.now(),
                        },
                        ...newEdgeStyle[edgeType],
                    };
                }
                return edge;
            }),
        });
    },
    refreshGate: (gateType: GraphEdgeType) => {
        const { edgeStyle } = get();
        set({
            nodes: get().nodes.map((node) => {
                if (node.data.isGate && node.data.gate === gateType) {
                    const gateColor = `${
                        edgeStyle[node.data.gate as GraphEdgeType].style.stroke
                    }70`;
                    return {
                        ...node,
                        data: {
                            ...node.data,
                        },
                        style: {
                            ...node.style,
                            backgroundColor: gateColor,
                        },
                    };
                }
                return node;
            }),
        });
    },
    getNewIdInEventMap: () => {
        let id = `resin:Events/${randomFiveDigit()}/`;
        while (get().mapNodes.has(id)) {
            id = `resin:Events/${randomFiveDigit()}/`;
        }
        return id;
    },
    onNodeClick: (event, node) => {
        set({ contextMenu: null, showAddPanel: null });
        const mapNodes = get().mapNodes;
        const currentNode = node.data.isGate
            ? mapNodes.get(node.data.referredNode)
            : mapNodes.get(node.id);
        console.log("currentNode", currentNode);
        if (
            !currentNode.subgroupEvents ||
            currentNode.subgroupEvents.length === 0 ||
            node.data.isGate
        ) {
            set({ clickedNode: node });
            return;
        }

        if (get().chosenNodes.includes(node.id)) {
            console.log("node.data.isExpanded", node.data);
            const allSubEvents = get().getAllCurrentSubgroupEvents(node.id);

            const newChosenNodes = get().chosenNodes.filter(
                (n) => !allSubEvents.includes(n)
            );

            console.log("currentNode", currentNode.id);
            const parentId = `gate-${currentNode.parent}`;
            console.log("parentId", parentId);
            const oldNodePosition = get().nodes.find(
                (n) => n.id === parentId
            )?.position;

            set({ chosenNodes: newChosenNodes, clickedNode: node });
            get().updateLayout();

            // reset the position of the node
            const newNodePosition = get().nodes.find(
                (n) => n.id === parentId
            )?.position;
            console.log("oldNodePosition", oldNodePosition);
            console.log("newNodePosition", newNodePosition);
            if (oldNodePosition && newNodePosition) {
                set({
                    deltaX: oldNodePosition?.x - newNodePosition?.x,
                    deltaY: oldNodePosition?.y - newNodePosition?.y,
                });
            }

            return;
        }

        const newChosenNodes = [...get().chosenNodes, node.id];

        console.log("currentNode", currentNode.id);
        const parentId = `gate-${currentNode.parent}`;
        console.log("parentId", parentId);
        const oldNodePosition = get().nodes.find(
            (n) => n.id === parentId
        )?.position;

        set({ chosenNodes: newChosenNodes, clickedNode: node });
        get().updateLayout();
        const newNodePosition = get().nodes.find(
            (n) => n.id === parentId
        )?.position;
        console.log("oldNodePosition", oldNodePosition);
        console.log("newNodePosition", newNodePosition);
        if (oldNodePosition && newNodePosition) {
            set({
                deltaX: oldNodePosition?.x - newNodePosition?.x,
                deltaY: oldNodePosition?.y - newNodePosition?.y,
            });
            // const {setCenter} = useReactFlow();
        }
    },

    getAllCurrentSubgroupEvents: (node: string) => {
        const tractNodes = [node];
        const { mapNodes, chosenNodes } = get();
        const objectNode = mapNodes.get(node);

        if (objectNode?.subgroupEvents === undefined) {
            return tractNodes;
        }

        if (node && chosenNodes.includes(node)) {
            for (const child of objectNode.subgroupEvents) {
                const childNode = mapNodes.get(child)?.id;
                tractNodes.push(
                    ...get().getAllCurrentSubgroupEvents(childNode)
                );
            }
        }

        return tractNodes;
    },
    nodeRerender: (nodeType: string = "eventNode") => {
        set({
            nodes: get().nodes.map((node) => {
                if (node.type === nodeType) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            key: Date.now(),
                        },
                    };
                }
                return node;
            }),
        });
    },
    onConnect: (connection: Connection) => {
        if (connection.source === null || connection.target === null) {
            return;
        }
        if (connection.source === connection.target) {
            return;
        }
        const sourceID = connection.source.startsWith("gate-")
            ? connection.source.slice(5)
            : connection.source;
        const targetID = connection.target.startsWith("gate-")
            ? connection.target.slice(5)
            : connection.target;
        const sourceNode = get().mapNodes.get(sourceID);
        const targetNode = get().mapNodes.get(targetID);
        if (sourceNode === undefined || targetNode === undefined) {
            console.log("sourceNode cannot be found", sourceNode);
            console.log("targetNode cannot be found", targetNode);
            return;
        }
        if (sourceNode.parent !== targetNode.parent) {
            alert("Cannot connect nodes from different parents");
            return;
        }
        if (sourceNode.outlinks === undefined) {
            sourceNode.outlinks = [];
        }
        if (sourceNode.outlinks.includes(targetID)) {
            return;
        }
        sourceNode.outlinks.push(targetID);
        get().updateLayout();
    },
    onEdgeUpdate: (oldEdge: Edge, newConnection: Connection) => {
        console.log("oldEdge", oldEdge);
        console.log("newConnection", newConnection);

        const { mapNodes } = get();
        const oldSourceID = oldEdge.source.startsWith("gate-")
            ? oldEdge.source.slice(5)
            : oldEdge.source;
        const oldTargetID = oldEdge.target.startsWith("gate-")
            ? oldEdge.target.slice(5)
            : oldEdge.target;
        const oldSourceNode = mapNodes.get(oldSourceID);
        if (oldSourceNode === undefined) {
            console.log("oldSourceNode cannot be found", oldSourceNode);
            return;
        }
        oldSourceNode.outlinks = oldSourceNode.outlinks.filter(
            (outlink: string) => outlink !== oldTargetID
        );
        if (newConnection.source === null || newConnection.target === null) {
            return;
        }
        const sourceID = newConnection.source.startsWith("gate-")
            ? newConnection.source.slice(5)
            : newConnection.source;
        const targetID = newConnection.target.startsWith("gate-")
            ? newConnection.target.slice(5)
            : newConnection.target;
        const sourceNode = mapNodes.get(sourceID);
        const targetNode = mapNodes.get(targetID);
        if (sourceNode === undefined || targetNode === undefined) {
            console.log("sourceNode cannot be found", sourceNode);
            console.log("targetNode cannot be found", targetNode);
            return;
        }
        if (sourceNode.parent !== targetNode.parent) {
            alert("Cannot connect nodes from different parents");
            return;
        }
        if (sourceNode.outlinks === undefined) {
            sourceNode.outlinks = [];
        }
        if (sourceNode.outlinks.includes(targetID)) {
            return;
        }
        sourceNode.outlinks.push(targetID);
        get().updateLayout();
    },
    onNodesDelete: (deleteNodes: Node[]) => {
        const { mapNodes, getAllCurrentSubgroupEvents } = get();
        deleteNodes.forEach((node) => {
            const nodeId = node.id.startsWith("gate-")
                ? node.id.slice(5)
                : node.id;
            console.log("nodeId", nodeId);
            const nodeToDelete = mapNodes.get(nodeId);
            if (nodeToDelete === undefined) {
                return;
            }
            const parentNode = mapNodes.get(nodeToDelete.parent);
            if (parentNode) {
                parentNode.subgroupEvents = parentNode.subgroupEvents.filter(
                    (subgroupEvent: string) => subgroupEvent !== nodeId
                );
                parentNode.subgroupEvents.forEach((subgroupEvent: string) => {
                    const subgroupEventNode = mapNodes.get(subgroupEvent);
                    if (subgroupEventNode.outlinks === undefined) {
                        return;
                    }
                    if (subgroupEventNode.outlinks.includes(nodeId)) {
                        subgroupEventNode.outlinks =
                            subgroupEventNode.outlinks.filter(
                                (outlink: string) => outlink !== nodeId
                            );
                        subgroupEventNode.outlinks.push(
                            ...nodeToDelete.outlinks
                        );
                    }
                });
            }

            console.log();
            getAllCurrentSubgroupEvents(nodeId).forEach(
                (subgroupEvent: string) => {
                    mapNodes.delete(subgroupEvent);
                }
            );
            set({
                mapNodes,
                clickedNode: null,
                chosenNodes: get().chosenNodes.filter(
                    (n) => !getAllCurrentSubgroupEvents(nodeId).includes(n)
                ),
            });
        });
        get().updateLayout();
    },

    updateLayout: () => {
        const {
            chosenNodes,
            mapNodes,
            firstNode,
            edgeStyle,
            confidenceInterval,
            entityChosenEvents,
        } = get();
        if (firstNode === null || mapNodes.size === 0) {
            return;
        }

        const newNodes = getLayoutedElementsNested(
            chosenNodes,
            mapNodes,
            firstNode
        );

        const layoutedNodes = newNodes.map((node) => {
            const isGate = node.data.isGate;
            const gateColor = isGate
                ? `${edgeStyle[node.data.gate as GraphEdgeType].style.stroke}70`
                : "white";
            const opacity =
                (entityChosenEvents.size === 0 ||
                    entityChosenEvents.has(node.id)) &&
                node.data.confidence >= confidenceInterval[0] &&
                node.data.confidence <= confidenceInterval[1]
                    ? 1
                    : 0.5;

            return {
                ...node,
                type: isGate ? "gate" : "eventNode",
                key: Date.now(),
                data: isGate
                    ? {
                          ...node.data,
                          color: edgeStyle[node.data.gate as GraphEdgeType]
                              .style.stroke,
                      }
                    : node.data,
                expandParent: isGate || node.data.isTopLevel ? undefined : true,
                parentNode:
                    isGate || node.id === firstNode
                        ? undefined
                        : `gate-${node.data.parent}`,
                style: {
                    ...node.style,
                    backgroundColor: gateColor,
                    opacity: opacity,
                },
            };
        });

        const newEdges: Edge[] = [];
        chosenNodes.forEach((source) => {
            const sourceNode = mapNodes.get(source);
            if (sourceNode.subgroupEvents) {
                const childrenGate = sourceNode.childrenGate;
                newEdges.push({
                    id: `e-${source}-subgroup-to-gate`,
                    source: source,
                    target: `gate-${source}`,
                    ...edgeStyle[childrenGate as GraphEdgeType],
                });
            }
        });

        const uniqueEdges = new Map<string, Edge>();
        newNodes.forEach((node) => {
            if (!node.data.isGate) {
                const currentNode = mapNodes.get(node.id);
                currentNode.outlinks?.forEach((outlink: string) => {
                    const edgeId = `e-${node.id}-${outlink}-outlink`;
                    if (!uniqueEdges.has(edgeId)) {
                        uniqueEdges.set(edgeId, {
                            id: edgeId,
                            source: node.id,
                            target: outlink,
                            sourceHandle: node.id + "_right",
                            targetHandle: outlink + "_left",
                            ...edgeStyle.outlink,
                        });
                    }
                });
            }
        });

        set({
            nodes: layoutedNodes,
            edges: [...newEdges, ...Array.from(uniqueEdges.values())],
        });
    },
}));

function randomFiveDigit() {
    return Math.floor(10000 + Math.random() * 90000).toString();
}

export default useStore;
