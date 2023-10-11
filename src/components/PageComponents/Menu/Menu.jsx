import {
    faBars,
    faDownload,
    faInfoCircle,
    faListSquares,
    faPlusSquare,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { JsonConvert } from "json2typescript";
import { useContext, useEffect, useState } from "react";
import { ConnectionLineType, ReactFlowProvider } from "reactflow";
import { Modal } from "../../CustomizedComponents/Modal/Modal";
import {
    EntityGraphPanelTA1,
    TableRow,
    TableRowTA1,
} from "../../CustomizedComponents/TableRow/TableRow";
import ToggleButton, {
    ToggleButtonTA1,
} from "../../CustomizedComponents/ToggleButton/ToggleButton";
import {
    DataContext,
    EntitiesContext,
    ExtractedTextsContext,
    ProvenanceContext,
    SchemaTypeContext,
} from "../../DataReadingComponents/DataReader";
import ZipReader from "../../DataReadingComponents/ZipReader";
import {
    TA1Entity,
    TA1EntityStrategy,
    TA1Event,
    TA1EventStrategy,
    TA1NodeRenderingStrategy,
} from "../../TA1/LibraryTA1";
import useStoreTA1 from "../../TA1/storeTA1";
import {
    DetectedNodeStrategy,
    Entity,
    EventNode,
    EventNodeType,
    NodeRenderingStrategy,
    PredictedNodeStrategy,
    SourceOnlyNodeStrategy,
} from "../../TA2/Library";
import useStore from "../../TA2/store";
import { UniqueString } from "../../utils/TypeScriptUtils";
import "./Menu.css";
import {
    TA2dataMergeMultipleFiles,
    TA2traverseAllEvents,
} from "../../DataReadingComponents/MergeMultipleFiles";
import { json } from "react-router-dom";

function Menu() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [option, setOption] = useState(null);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };
    return (
        <>
            <FontAwesomeIcon
                icon={faBars}
                className="menu-icon"
                onClick={toggleMenu}
                title="Menu"
            />
            {isMenuOpen && (
                <div className="menu-container">
                    <div onClick={() => setOption("Add JSON")}>
                        <FontAwesomeIcon
                            icon={faPlusSquare}
                            className="menu-item"
                            title="Add Schema Data"
                        />
                    </div>

                    <div onClick={() => setOption("Download JSON")}>
                        <FontAwesomeIcon
                            icon={faDownload}
                            className="menu-item"
                            title="Download JSON"
                        />
                    </div>
                    <div onClick={() => setOption("See Legend")}>
                        <FontAwesomeIcon
                            icon={faInfoCircle}
                            className="menu-item"
                            title="See Legend"
                        />
                    </div>
                    <div onClick={() => setOption("Global Entity List")}>
                        <FontAwesomeIcon
                            icon={faListSquares}
                            className="menu-item"
                            title="Global Entity List"
                        />
                    </div>
                </div>
            )}
            {option && (
                <MenuOptionPanel option={option} setOption={setOption} />
            )}
        </>
    );
}
const MenuOptionPanel = ({ option, setOption }) => {
    const closePanel = () => {
        setOption(null);
    };
    const [isEnlarged, setIsEnlarged] = useState(false);
    const toggleEnlarged = () => {
        setIsEnlarged(!isEnlarged);
    };

    return (
        <div
            className={
                isEnlarged ? "menu-option-panel-enlarged" : "menu-option-panel"
            }
        >
            <Modal
                isEnlarged={isEnlarged}
                handleClick={closePanel}
                toggleEnlarged={toggleEnlarged}
            />
            {option === "Add JSON" && <AddJSONPanel />}
            {option === "Download JSON" && <DownloadJSONPanel />}
            {option === "See Legend" && <SeeLegendPanel />}
            {option === "Global Entity List" && <GlobalEntityList />}
        </div>
    );
};

function AddJSONPanel() {
    const [activeTab, setActiveTab] = useState("ta2");
    const [SchemaType, setSchemaType] = useContext(SchemaTypeContext);
    const [jsonData, setJsonData] = useContext(DataContext);
    const [extractedTexts, setExtractedTexts] = useContext(
        ExtractedTextsContext
    );

    const [setChosenNodes, setChosenEntities, setClickedNode] = useStore(
        (state) => [
            state.setChosenNodes,
            state.setChosenEntities,
            state.setClickedNode,
        ]
    );

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const handleJSONUpload = (event) => {
        setChosenNodes([]);
        setChosenEntities([]);
        setClickedNode(null);
        UniqueString.reset();
        if (event.target.files.length === 0) {
            return;
        } else if (event.target.files.length === 1) {
            const fileReader = new FileReader();
            fileReader.readAsText(event.target.files[0], "UTF-8");
            fileReader.onload = (e) => {
                let parsedJson = JSON.parse(e.target.result);
                if (activeTab === "ta1") {
                    // parsedJson = convertTA1toTA2format(parsedJson);
                    setSchemaType("ta1");
                    setJsonData(parsedJson);
                } else {
                    setSchemaType("ta2");
                    setJsonData(parsedJson);
                }
            };
        } else {
            console.log("Multiple files uploaded");
            const files = event.currentTarget.files;
            const jsonList = [];

            Object.keys(files).forEach((i) => {
                const file = files[i];
                const reader = new FileReader();

                reader.onload = (e) => {
                    try {
                        const jsonData = JSON.parse(e.target.result);
                        jsonList.push(jsonData);
                    } catch (error) {
                        console.error(
                            "Error parsing JSON from file:",
                            file.name
                        );
                    }

                    if (jsonList.length === files.length) {
                        console.log("All files processed");
                        console.log("jsonList", jsonList);
                        if (activeTab === "ta2") {
                            const mergedJson =
                                TA2dataMergeMultipleFiles(jsonList);
                            console.log("mergedJson", mergedJson);
                            setSchemaType("ta2");
                            setJsonData(mergedJson);
                        }
                    }
                };

                reader.readAsText(file, "UTF-8");
            });
        }
    };

    const handleParsedTextFile = (event) => {
        if (event.target.files.length === 0) {
            return;
        } else if (event.target.files.length === 1) {
            const fileReader = new FileReader();
            const extractedTexts = new Map();
            fileReader.readAsText(event.target.files[0], "UTF-8");
            fileReader.onload = (e) => {
                const parsedJson = JSON.parse(e.target.result);
                if (
                    parsedJson !== undefined &&
                    parsedJson.rsd_data !== undefined
                ) {
                    for (const [key, value] of Object.entries(
                        parsedJson.rsd_data.en
                    )) {
                        extractedTexts.set(key, value);
                    }
                    setExtractedTexts(extractedTexts);
                }
            };
        } else {
            console.log("Multiple files uploaded");
            const files = event.currentTarget.files;
            const jsonList = [];

            Object.keys(files).forEach((i) => {
                const file = files[i];
                const reader = new FileReader();

                reader.onload = (e) => {
                    try {
                        const jsonData = JSON.parse(e.target.result);
                        jsonList.push(jsonData);
                    } catch (error) {
                        console.error(
                            "Error parsing JSON from file:",
                            file.name
                        );
                    }

                    if (jsonList.length === files.length) {
                        console.log("All files processed");
                        console.log("jsonList", jsonList);
                        const extractedTexts = new Map();
                        jsonList.forEach((parsedJson) => {
                            if (
                                parsedJson !== undefined &&
                                parsedJson.rsd_data !== undefined
                            ) {
                                for (const [key, value] of Object.entries(
                                    parsedJson.rsd_data.en
                                )) {
                                    extractedTexts.set(key, value);
                                }
                            }
                        });
                        setExtractedTexts(extractedTexts);
                    }
                };

                reader.readAsText(file, "UTF-8");
            });
        }
    };
    useEffect(() => {
        console.log("schemaType", SchemaType);
    }, [SchemaType]);

    return (
        <div>
            <div className="tab-bar">
                <button
                    className={` button-tabbar ${
                        activeTab === "ta1" ? "button-tabbar-active" : ""
                    }`}
                    onClick={() => handleTabClick("ta1")}
                >
                    TA1
                </button>
                <button
                    className={`button-tabbar ${
                        activeTab === "ta2" ? "button-tabbar-active" : ""
                    } `}
                    onClick={() => handleTabClick("ta2")}
                >
                    TA2
                </button>
            </div>
            {activeTab === "ta1" && (
                <>
                    <h2>Upload TA1 Schema</h2>
                    <h3>Upload TA1 Schema File</h3>
                    {jsonData.ceID && <h4>Current File: {jsonData.ceID}</h4>}
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleJSONUpload}
                    />
                </>
            )}
            {activeTab === "ta2" && (
                <>
                    <h2>Upload TA2 Schema Matching Results</h2>
                    <h3>TA2 Schema Matching Results</h3>
                    {jsonData.ceID && <h4>Current File: {jsonData.ceID}</h4>}
                    <input
                        type="file"
                        accept=".json"
                        multiple
                        onChange={handleJSONUpload}
                    />
                    <h3>Provenance Source Text File</h3>
                    {extractedTexts && (
                        <h4>Number of Extracted Text: {extractedTexts.size}</h4>
                    )}
                    <input
                        type="file"
                        accept=".json"
                        multiple
                        onChange={handleParsedTextFile}
                    />
                    <h3>Image Zip File</h3>
                    <ZipReader />
                </>
            )}
        </div>
    );
}
const TA1DownloadPanel = () => {
    const [jsonData] = useContext(DataContext);
    const [mapNodes, mapEntities] = useStoreTA1((state) => [
        state.mapNodes,
        state.mapEntities,
    ]);
    const jsonConverter = new JsonConvert();
    const newData = { ...jsonData };
    console.log("mapEntity", mapEntities);
    newData.events.forEach((event) => {
        event.entities = event.entities.map((entity) =>
            jsonConverter.serialize(mapEntities.get(entity["@id"]), TA1Entity)
        );
    });
    console.log("newData", newData);
    const downloadJSON = () => {
        const dataStr =
            "data:text/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(newData));
        const dlAnchorElem = document.createElement("a");
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "schema.json");
        dlAnchorElem.click();
    };
    return (
        <div>
            <button onClick={downloadJSON}>Download TA1 Schema</button>
        </div>
    );
};
const TA2DownloadPanel = () => {
    const [jsonData] = useContext(DataContext);
    // const [EventNodes] = useContext(EventsContext);
    const [mapNodes] = useStore((state) => [state.mapNodes]);
    const [Provenances] = useContext(ProvenanceContext);
    const [Entities] = useContext(EntitiesContext);
    const jsonConverter = new JsonConvert();
    const downloadJSON = () => {
        const newData = { ...jsonData };
        newData.instances[0].events = jsonConverter.serializeArray(
            Array.from(mapNodes.values()),
            EventNode
        );
        newData.instances[0].entities = jsonConverter.serializeArray(
            Array.from(Entities.values()),
            Entity
        );
        newData.provenanceData = jsonConverter.serializeArray(
            Array.from(Provenances.values())
        );
        console.log("newData", newData);
        const dataStr =
            "data:text/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(newData, null, "\t"));

        const downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "data.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const downloadIndividualCE = (ceID) => {
        // const mapEvents = jsonData.mapEvents;
        // const mapEntities = jsonData.mapEntities;
        // const mapProvenances = jsonData.mapProvenances;
        // const mapRelations = jsonData.mapRelations;
        // const mapValues = jsonData.mapValues;
        const topLevelEvent = jsonData.isTopLevelEvents.get(ceID)["@id"];

        const TA2traverseAllEventsData = TA2traverseAllEvents(
            mapNodes,
            topLevelEvent
        );
        const allEvents = jsonConverter.serializeArray(
            Array.from(mapNodes.values())
                .filter((event) =>
                    TA2traverseAllEventsData.eventsSet.has(event.id)
                )
                .map((event) => {
                    if (event.id === topLevelEvent) {
                        event.isTopLevel = true;
                        event.parent = "kairos:NULL";
                    }
                    return event;
                }),
            EventNode
        );
        const newData = {
            ceID: ceID,
            "@context": jsonData["@context"].filter(
                (context) => context.ceID === ceID
            )[0],
            instances: [
                {
                    ...jsonData.instances[0],
                    events: allEvents,
                    entities: jsonConverter.serializeArray(
                        Array.from(Entities.values()).filter((entity) =>
                            TA2traverseAllEventsData.entitiesSet.has(entity.id)
                        ),
                        Entity
                    ),
                    relations: jsonData.instances[0].relations.filter(
                        (relation) =>
                            TA2traverseAllEventsData.entitiesSet.has(
                                relation.relationObject
                            ) &&
                            TA2traverseAllEventsData.entitiesSet.has(
                                relation.relationSubject
                            )
                    ),
                },
            ],
            provenanceData: jsonConverter.serializeArray(
                Array.from(Provenances.values()).filter((provenance) =>
                    TA2traverseAllEventsData.provenanceSet.has(provenance.id)
                )
            ),
        };

        console.log("newData", newData);
        const dataStr =
            "data:text/json;charset=utf-8," +
            encodeURIComponent(JSON.stringify(newData, null, "\t"));

        const downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", ceID + ".json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };
    return (
        <div>
            <h2>Download TA2 Schema Matching Result Files</h2>
            <button onClick={() => downloadJSON()}>Download</button>
            {jsonData.mergedCEs && (
                <>
                    <h3> Download Individual Schema Matching Result</h3>
                    {jsonData.mergedCEs.map((ceID) => (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                            }}
                        >
                            <button onClick={() => downloadIndividualCE(ceID)}>
                                {ceID}
                            </button>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
};
function DownloadJSONPanel() {
    const [schemaType] = useContext(SchemaTypeContext);
    if (schemaType === "ta1") {
        return <TA1DownloadPanel />;
    } else {
        return <TA2DownloadPanel />;
    }
}
const TA1Legend = () => {
    const [
        updateNodeAttribute,
        updateTreeNodeAttribute,
        edgeStyle,
        updateEdgeStyle,
        updateEdgeAttribute,
        refreshGate,
    ] = useStoreTA1((state) => [
        state.updateNodeAttribute,
        state.updateTreeNodeAttribute,
        state.edgeStyle,
        state.updateEdgeStyle,
        state.updateEdgeAttribute,
        state.nodeRerender,
        state.refreshGate,
    ]);
    const jsonConverter = new JsonConvert();
    return (
        <div className="legend">
            <h2>Legend</h2>
            <h3>Colors</h3>
            {[
                ["event", TA1EventStrategy.colorOptions],
                ["entity", TA1EntityStrategy.colorOptions],
            ].map(([key, value]) => (
                <div
                    key={key}
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                    }}
                >
                    <input
                        type="color"
                        value={value}
                        onChange={(e) =>
                            updateNodeAttribute(key, e.target.value)
                        }
                        key={key}
                        style={{ marginRight: "10px" }}
                    />
                    <h4>{key === "event" ? "Event" : "Entity"}</h4>
                </div>
            ))}

            <h3>Shapes</h3>
            {[
                ["parentNode", TA1NodeRenderingStrategy.nodeOptions.parentNode],
                ["leafNode", TA1NodeRenderingStrategy.nodeOptions.leafNode],
                ["entity", TA1NodeRenderingStrategy.nodeOptions.entityNode],
            ].map(([key, value]) => (
                <div key={key}>
                    <h4>
                        {key === "parentNode"
                            ? "Chapter Event"
                            : key === "leafNode"
                            ? "Primitive Event"
                            : "Participant Entity"}
                    </h4>

                    <ReactFlowProvider>
                        {key === "parentNode"
                            ? jsonConverter
                                  .deserialize(
                                      {
                                          "@id": "AA",
                                          children: ["BB", "CC"],
                                          name: "",
                                      },
                                      TA1Event
                                  )
                                  .render()
                            : key === "leafNode"
                            ? jsonConverter
                                  .deserialize(
                                      {
                                          "@id": "AA",
                                          name: "",
                                      },
                                      TA1Event
                                  )
                                  .render()
                            : jsonConverter
                                  .deserialize(
                                      {
                                          "@id": "AA",
                                          name: "",
                                      },
                                      TA1Entity
                                  )
                                  .render()}
                    </ReactFlowProvider>

                    <select
                        value={value}
                        // onChange={(e) => handleShapeChange(e, key)}
                        onChange={(e) =>
                            updateTreeNodeAttribute(key, e.target.value)
                        }
                    >
                        <option value="circle">Circle</option>
                        <option value="diamond">Diamond</option>
                        <option value="square">Square</option>
                    </select>
                </div>
            ))}
            <h3>Edges</h3>
            {["or", "and", "xor", "outlink", "participant", "relation"].map(
                (childrenGate, index) => (
                    <div key={index}>
                        <h4>{childrenGate}</h4>
                        <div>
                            <table>
                                <tbody>
                                    <tr>
                                        <td>Color</td>
                                        <td>
                                            <input
                                                type="color"
                                                value={
                                                    edgeStyle[childrenGate]
                                                        .style.stroke
                                                }
                                                onChange={(e) => {
                                                    updateEdgeStyle(
                                                        childrenGate,
                                                        {
                                                            stroke: e.target
                                                                .value,
                                                        }
                                                    );
                                                    if (
                                                        edgeStyle[childrenGate]
                                                            .markerEnd
                                                    ) {
                                                        updateEdgeAttribute(
                                                            childrenGate,
                                                            "markerEnd",
                                                            {
                                                                ...edgeStyle[
                                                                    childrenGate
                                                                ].markerEnd,
                                                                color: e.target
                                                                    .value,
                                                            }
                                                        );
                                                    }
                                                    if (
                                                        childrenGate !==
                                                        "outlink"
                                                    ) {
                                                        refreshGate(
                                                            childrenGate
                                                        );
                                                    }
                                                }}
                                                label="color"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Stroke Width</td>
                                        <td>
                                            <input
                                                type="number"
                                                value={
                                                    edgeStyle[childrenGate]
                                                        .style.strokeWidth
                                                }
                                                onChange={(e) =>
                                                    updateEdgeStyle(
                                                        childrenGate,
                                                        {
                                                            strokeWidth:
                                                                e.target.value,
                                                        }
                                                    )
                                                }
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Label</td>
                                        <td>
                                            <input
                                                type="text"
                                                value={
                                                    edgeStyle[childrenGate]
                                                        .label
                                                }
                                                onChange={(e) =>
                                                    updateEdgeAttribute(
                                                        childrenGate,
                                                        "label",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Edge Type</td>
                                        <td>
                                            <select
                                                value={
                                                    edgeStyle[childrenGate].type
                                                }
                                                onChange={(e) =>
                                                    updateEdgeAttribute(
                                                        childrenGate,
                                                        "type",
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option
                                                    value={
                                                        ConnectionLineType.Straight
                                                    }
                                                >
                                                    Straight
                                                </option>
                                                <option
                                                    value={
                                                        ConnectionLineType.Bezier
                                                    }
                                                >
                                                    Bezier
                                                </option>
                                                <option
                                                    value={
                                                        ConnectionLineType.SimpleBezier
                                                    }
                                                >
                                                    Simple Bezier
                                                </option>
                                                <option
                                                    value={
                                                        ConnectionLineType.SmoothStep
                                                    }
                                                >
                                                    Smooth Step
                                                </option>
                                                <option
                                                    value={
                                                        ConnectionLineType.Step
                                                    }
                                                >
                                                    Step
                                                </option>
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Edge Pattern</td>
                                        <td>
                                            <select
                                                value={
                                                    edgeStyle[childrenGate]
                                                        .style.strokeDasharray
                                                }
                                                onChange={(e) =>
                                                    updateEdgeStyle(
                                                        childrenGate,
                                                        {
                                                            strokeDasharray:
                                                                e.target.value,
                                                        }
                                                    )
                                                }
                                            >
                                                <option value={"none"}>
                                                    Solid
                                                </option>
                                                <option value={"5,5"}>
                                                    Dashed
                                                </option>
                                                <option value={"4 1 2 3"}>
                                                    Uneven Dashed
                                                </option>
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Animation</td>
                                        <td>
                                            <input
                                                type="checkbox"
                                                value={
                                                    edgeStyle[childrenGate]
                                                        .animated
                                                }
                                                onChange={(e) =>
                                                    updateEdgeAttribute(
                                                        childrenGate,
                                                        "animated",
                                                        e.target.checked
                                                    )
                                                }
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            )}
        </div>
    );
};
const TA2Legend = () => {
    const [
        updateNodeAttribute,
        updateTreeNodeAttribute,
        edgeStyle,
        updateEdgeStyle,
        updateEdgeAttribute,
        refreshGate,
    ] = useStore((state) => [
        state.updateNodeAttribute,
        state.updateTreeNodeAttribute,
        state.edgeStyle,
        state.updateEdgeStyle,
        state.updateEdgeAttribute,
        state.nodeRerender,
        state.refreshGate,
    ]);

    const parentNode = new EventNode("newId", null, " ");
    parentNode.subgroupEvents = ["AAA"];

    return (
        <div className="legend">
            <h2>Legend</h2>
            <ReactFlowProvider>
                <h3>Colors</h3>
                {[
                    [
                        EventNodeType.Detected,
                        DetectedNodeStrategy.options.color,
                    ],
                    [
                        EventNodeType.Predicted,
                        PredictedNodeStrategy.options.color,
                    ],
                    [
                        EventNodeType.SourceOnly,
                        SourceOnlyNodeStrategy.options.color,
                    ],
                ].map(([key, value]) => (
                    <div
                        key={key}
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                    >
                        <input
                            type="color"
                            value={value}
                            onChange={(e) =>
                                updateNodeAttribute(
                                    key,
                                    "color",
                                    e.target.value
                                )
                            }
                            key={key}
                            style={{ marginRight: "10px" }}
                        />
                        <h4>
                            {key === "detected"
                                ? "Matched Event"
                                : key === "sourceOnly"
                                ? "Source-only Event"
                                : "Predicted Event"}
                        </h4>
                    </div>
                ))}

                <h3>Shapes</h3>
                {[
                    [
                        "parentNode",
                        NodeRenderingStrategy.nodeOptions.parentNode,
                    ],
                    ["leafNode", NodeRenderingStrategy.nodeOptions.leafNode],
                ].map(([key, value]) => (
                    <div key={key}>
                        <h4>
                            {key === "parentNode"
                                ? "Chapter Event"
                                : "Primitive Event"}
                        </h4>
                        {key === "parentNode"
                            ? parentNode.render()
                            : new EventNode("aa", null, " ").render()}
                        <select
                            value={value}
                            // onChange={(e) => handleShapeChange(e, key)}
                            onChange={(e) =>
                                updateTreeNodeAttribute(key, e.target.value)
                            }
                        >
                            <option value="circle">Circle</option>
                            <option value="diamond">Diamond</option>
                            <option value="square">Square</option>
                        </select>
                    </div>
                ))}

                <h3>Edges</h3>
                {["or", "and", "xor", "outlink"].map((childrenGate, index) => (
                    <div key={index}>
                        <h4>{childrenGate}</h4>
                        <div>
                            <table>
                                <tbody>
                                    <tr>
                                        <td>Color</td>
                                        <td>
                                            <input
                                                type="color"
                                                value={
                                                    edgeStyle[childrenGate]
                                                        .style.stroke
                                                }
                                                onChange={(e) => {
                                                    updateEdgeStyle(
                                                        childrenGate,
                                                        {
                                                            stroke: e.target
                                                                .value,
                                                        }
                                                    );
                                                    if (
                                                        edgeStyle[childrenGate]
                                                            .markerEnd
                                                    ) {
                                                        updateEdgeAttribute(
                                                            childrenGate,
                                                            "markerEnd",
                                                            {
                                                                ...edgeStyle[
                                                                    childrenGate
                                                                ].markerEnd,
                                                                color: e.target
                                                                    .value,
                                                            }
                                                        );
                                                    }
                                                    if (
                                                        childrenGate !==
                                                        "outlink"
                                                    ) {
                                                        refreshGate(
                                                            childrenGate
                                                        );
                                                    }
                                                }}
                                                label="color"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Stroke Width</td>
                                        <td>
                                            <input
                                                type="number"
                                                value={
                                                    edgeStyle[childrenGate]
                                                        .style.strokeWidth
                                                }
                                                onChange={(e) =>
                                                    updateEdgeStyle(
                                                        childrenGate,
                                                        {
                                                            strokeWidth:
                                                                e.target.value,
                                                        }
                                                    )
                                                }
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Label</td>
                                        <td>
                                            <input
                                                type="text"
                                                value={
                                                    edgeStyle[childrenGate]
                                                        .label
                                                }
                                                onChange={(e) =>
                                                    updateEdgeAttribute(
                                                        childrenGate,
                                                        "label",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Edge Type</td>
                                        <td>
                                            <select
                                                value={
                                                    edgeStyle[childrenGate].type
                                                }
                                                onChange={(e) =>
                                                    updateEdgeAttribute(
                                                        childrenGate,
                                                        "type",
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option
                                                    value={
                                                        ConnectionLineType.Straight
                                                    }
                                                >
                                                    Straight
                                                </option>
                                                <option
                                                    value={
                                                        ConnectionLineType.Bezier
                                                    }
                                                >
                                                    Bezier
                                                </option>
                                                <option
                                                    value={
                                                        ConnectionLineType.SimpleBezier
                                                    }
                                                >
                                                    Simple Bezier
                                                </option>
                                                <option
                                                    value={
                                                        ConnectionLineType.SmoothStep
                                                    }
                                                >
                                                    Smooth Step
                                                </option>
                                                <option
                                                    value={
                                                        ConnectionLineType.Step
                                                    }
                                                >
                                                    Step
                                                </option>
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Edge Pattern</td>
                                        <td>
                                            <select
                                                value={
                                                    edgeStyle[childrenGate]
                                                        .style.strokeDasharray
                                                }
                                                onChange={(e) =>
                                                    updateEdgeStyle(
                                                        childrenGate,
                                                        {
                                                            strokeDasharray:
                                                                e.target.value,
                                                        }
                                                    )
                                                }
                                            >
                                                <option value={"none"}>
                                                    Solid
                                                </option>
                                                <option value={"5,5"}>
                                                    Dashed
                                                </option>
                                                <option value={"4 1 2 3"}>
                                                    Uneven Dashed
                                                </option>
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Animation</td>
                                        <td>
                                            <input
                                                type="checkbox"
                                                value={
                                                    edgeStyle[childrenGate]
                                                        .animated
                                                }
                                                onChange={(e) =>
                                                    updateEdgeAttribute(
                                                        childrenGate,
                                                        "animated",
                                                        e.target.checked
                                                    )
                                                }
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </ReactFlowProvider>
        </div>
    );
};
function SeeLegendPanel() {
    const [schemaType] = useContext(SchemaTypeContext);
    if (schemaType === "ta1") {
        return <TA1Legend />;
    }
    if (schemaType === "ta2") {
        return <TA2Legend />;
    }
    return null;
}
const TA1GlobalEntityList = () => {
    const [Entities] = useContext(EntitiesContext);
    const [relatedEntities, chosenEntities] = useStoreTA1((state) => [
        state.entitiesRelatedEventMap,
        state.chosenEntities,
    ]);
    const [EntitiesList, setEntitiesList] = useState([]);
    console.log("relatedEntities", relatedEntities);
    console.log("entities", Entities);
    useEffect(() => {
        const newEntitiesList = [];
        for (const [entityName, events] of relatedEntities) {
            const key = `${entityName}`;
            const entity = Entities.get(entityName);
            if (entity === undefined) {
                continue;
            }
            newEntitiesList.push(
                <ToggleButtonTA1
                    key={key}
                    id={key}
                    name={entity.name}
                    relatedEventsLength={events.length}
                    chosen={chosenEntities.includes(key)}
                />
            );
        }
        setEntitiesList(
            newEntitiesList.length > 0 ? (
                newEntitiesList
            ) : (
                <div>No Entities</div>
            )
        );
    }, [Entities]);

    return (
        <div>
            <div>{EntitiesList}</div>
        </div>
    );
};
const TA2GlobalEntityList = () => {
    const [Entities] = useContext(EntitiesContext);
    const [relatedEntities, chosenEntities] = useStore((state) => [
        state.entitiesRelatedEventMap,
        state.chosenEntities,
    ]);
    const [EntitiesList, setEntitiesList] = useState([]);
    useEffect(() => {
        const newEntitiesList = [];
        for (const [entityName, events] of relatedEntities) {
            const key = `${entityName}`;
            const entity = Entities.get(entityName);
            if (entity === undefined) {
                continue;
            }
            newEntitiesList.push(
                <ToggleButton
                    key={key}
                    id={key}
                    name={entity.name}
                    relatedEventsLength={events.length}
                    chosen={chosenEntities.includes(key)}
                />
            );
        }
        setEntitiesList(
            newEntitiesList.length > 0 ? (
                newEntitiesList
            ) : (
                <div>No Entities</div>
            )
        );
    }, [Entities]);

    return (
        <div>
            <div>{EntitiesList}</div>
        </div>
    );
};

const TA1GlobalEntityTable = () => {
    const [Entities] = useContext(EntitiesContext);
    const [relatedEntities, chosenEntities] = useStoreTA1((state) => [
        state.entitiesRelatedEventMap,
        state.chosenEntities,
    ]);
    const [EntitiesTable, setEntitiesTable] = useState([]);
    useEffect(() => {
        const newEntitiesTable = [];
        for (const [entityName, events] of relatedEntities) {
            const key = `${entityName}`;
            const entity = Entities.get(entityName);
            if (entity === undefined) {
                continue;
            }
            newEntitiesTable.push(
                <TableRowTA1
                    key={key}
                    id={key}
                    name={entity.name}
                    wd_label={entity.wd_label}
                    relatedEvents={events}
                    chosen={chosenEntities.includes(key)}
                />
            );
        }
        setEntitiesTable(
            newEntitiesTable.length > 0 ? (
                newEntitiesTable
            ) : (
                <div>No Entities</div>
            )
        );
    }, [Entities]);

    return (
        <table>
            <tr>
                <th scope="col">Filter</th>
                <th scope="col">Entity Name</th>
                <th scope="col">WikiData Label</th>
                <th scope="col">Entity Id</th>
                <th scope="col">Participate In</th>
            </tr>
            {EntitiesTable}
        </table>
    );
};
const TA2GlobalEntityTable = () => {
    const [Entities] = useContext(EntitiesContext);
    const [relatedEntities, chosenEntities] = useStore((state) => [
        state.entitiesRelatedEventMap,
        state.chosenEntities,
    ]);
    const [EntitiesTable, setEntitiesTable] = useState([]);
    useEffect(() => {
        const newEntitiesTable = [];
        for (const [entityName, events] of relatedEntities) {
            const key = `${entityName}`;
            const entity = Entities.get(entityName);
            if (entity === undefined) {
                continue;
            }
            newEntitiesTable.push(
                <TableRow
                    key={key}
                    id={key}
                    wd_label={entity.wd_label}
                    name={entity.name}
                    relatedEvents={events}
                    chosen={chosenEntities.includes(key)}
                />
            );
        }
        setEntitiesTable(
            newEntitiesTable.length > 0 ? (
                newEntitiesTable
            ) : (
                <div>No Entities</div>
            )
        );
    }, [Entities]);

    return (
        <table>
            <tr>
                <th>Filter</th>
                <th>Entity Name</th>
                <th>WikiData Label</th>
                <th>Entity Id</th>
                <th>Participate In</th>
            </tr>
            {EntitiesTable}
        </table>
    );
};
function GlobalEntityList() {
    const [schemaType] = useContext(SchemaTypeContext);
    console.log("schemaType over here", schemaType);
    const [mode, setMode] = useState("list");
    return (
        <>
            <div className="tab-bar">
                <button
                    className={` button-tabbar ${
                        mode === "list" ? "button-tabbar-active" : ""
                    }`}
                    onClick={() => setMode("list")}
                >
                    List
                </button>
                <button
                    className={`button-tabbar ${
                        mode === "table" ? "button-tabbar-active" : ""
                    } `}
                    onClick={() => setMode("table")}
                >
                    Table
                </button>
                {schemaType === "ta1" && (
                    <button
                        className={`button-tabbar ${
                            mode === "graph" ? "button-tabbar-active" : ""
                        } `}
                        onClick={() => setMode("graph")}
                    >
                        Graph
                    </button>
                )}
            </div>
            {mode === "list" ? (
                <div>
                    <h2>Global Entity List</h2>
                    {schemaType === "ta1" ? (
                        <TA1GlobalEntityList />
                    ) : (
                        <TA2GlobalEntityList />
                    )}
                </div>
            ) : mode === "table" ? (
                <div>
                    <h2>Global Entity Table</h2>
                    {schemaType === "ta1" ? (
                        <TA1GlobalEntityTable />
                    ) : (
                        <TA2GlobalEntityTable />
                    )}
                </div>
            ) : (
                <EntityGraphPanelTA1 />
            )}
        </>
    );
}

export default Menu;
