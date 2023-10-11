import dagre from "dagre";

const nodeWidth = 200;
const nodeHeight = 200;
const getLayoutedElements = (
    nodes,
    edges,
    direction = "TB",
    getGraph = false
) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    const isHorizontal = direction === "LR";
    dagreGraph.setGraph({
        rankdir: direction,
        ranker: "tight-tree",
        ranksep: isHorizontal ? 100 : 100,
        align: isHorizontal ? "UL" : undefined,
        nodesep: isHorizontal ? 50 : 300,
    });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, {
            width: node.width ? node.width : nodeWidth,
            height: node.height ? node.height : nodeHeight,
        });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? "left" : "top";
        node.sourcePosition = isHorizontal ? "right" : "bottom";

        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        node.position = {
            x: nodeWithPosition.x - (node.width ? node.width : nodeWidth) / 2,
            y:
                nodeWithPosition.y -
                (node.height ? node.height : nodeHeight) / 2,
        };

        return node;
    });
    if (getGraph) {
        return {
            nodes: nodes,
            edges: edges,
            width: dagreGraph.graph().width,
            height: dagreGraph.graph().height,
            position: dagreGraph.graph().position,
        };
    }

    return { nodes, edges };
};
const getLayoutedElementsNested = (chosenNodes, mapNodes, firstNode) => {
    const nodes = [];
    if (firstNode && firstNode !== null && firstNode !== undefined) {
        const subgraphs = chosenNodes.map((node) => {
            const currentNode = mapNodes.get(node);
            const subGraphNodes = currentNode.subgroupEvents?.map((subNode) => {
                return {
                    id: subNode,
                    data: {
                        isGate: false,
                        isTopLevel:
                            currentNode.isTopLevel === "true"
                                ? true
                                : undefined,
                        parent: node,
                        confidence: mapNodes.get(subNode).confidence[0],
                        color: mapNodes.get(subNode).renderStrategy.color,
                    },
                    position: { x: 0, y: 0 },
                };
            });
            const subGraphEdges =
                currentNode.subgroupEvents?.flatMap((subNode) =>
                    mapNodes.get(subNode).outlinks.map((outlinkNode) => ({
                        id: `outlink-${subNode}-${outlinkNode}`,
                        source: subNode,
                        target: outlinkNode,
                    }))
                ) || [];

            const graph = getLayoutedElements(
                subGraphNodes,
                subGraphEdges,
                "LR",
                true
            );
            return {
                id: `subgraph-${node}`,
                width: graph.width,
                height: graph.height,
                position: { x: 0, y: 0 },
                data: {
                    nodes: [
                        {
                            id: `gate-${node}`,
                            data: {
                                gate: currentNode.childrenGate,
                                name: currentNode.name,
                                isGate: true,
                                referredNode: currentNode.id,
                                confidence: currentNode.confidence[0],
                            },
                            style: {
                                width: graph.width + 100,
                                height: graph.height + 100,
                                zIndex: -10,
                            },
                        },
                        ...graph.nodes,
                    ],
                    edges: graph.edges,
                },
            };
        });
        const subgraphEdges = chosenNodes.flatMap((node) => {
            const parentNode = mapNodes.get(node).parent
                ? mapNodes.get(node).parent
                : "root";
            return [
                {
                    id: `subgraph-edge-${parentNode}-gate-${parentNode}`,
                    source: `subgraph-${parentNode}`,
                    target: `gate-${parentNode}`,
                },
                {
                    id: `subgraph-edge-gate-${parentNode}-${node}`,
                    source: `gate-${parentNode}`,
                    target: `subgraph-${node}`,
                },
            ];
        });
        const firstNodeData = mapNodes.get(firstNode);
        subgraphs.push({
            id: `subgraph-${firstNodeData.parent}`,
            width: 200,
            height: 200,
            data: {
                nodes: [
                    {
                        id: firstNode,
                        data: {
                            isGate: false,
                            confidence: firstNodeData.confidence[0],
                            color: firstNodeData.renderStrategy.color,
                            isTopLevel: true
                        },
                        position: { x: 0, y: 0 },
                    },
                ],
                edges: [],
            },
        });
        const outerGraph = getLayoutedElements(
            subgraphs,
            subgraphEdges,
            "TB",
            true
        );
        nodes.push(
            ...outerGraph.nodes.flatMap((parentNode) =>
                parentNode.data.nodes.map((node) => ({
                    ...node,
                    position: {
                        x: node.data.isGate || node.data.isTopLevel
                            ? parentNode.position.x
                            : node.position.x + 25,
                        y: node.data.isGate || node.data.isTopLevel
                            ? parentNode.position.y
                            : node.position.y + 80,
                    },
                }))
            )
        );
    }
    return nodes;
};

export default getLayoutedElementsNested;
