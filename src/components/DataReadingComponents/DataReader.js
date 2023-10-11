import { JsonConvert } from "json2typescript";
import React, { createContext, useEffect } from "react";
import {
    Entity,
    EventNode,
    createProvenanceEntity,
} from "../TA2/Library";
import {
    Relation,
    TA1Entity,
    TA1Event,
} from "../TA1/LibraryTA1";

import defaultData from "../../data/resin-resin-task1-ce2013.json";
import defaultText from "../../data/triggers.json";
import Graph from "../../pages/TA2/Graph.js";
import GraphTA1 from "../../pages/TA1/GraphTA1.jsx";
import { EventGraphNode } from "../CustomizedNodes/EventGraphNode/EventGraphNode.js";
import Gate from "../CustomizedComponents/Gates/Gate.jsx";
import { CustomNode } from "../CustomizedNodes/CustomNode/CustomNode.js";

export const EntitiesContext = createContext({});
export const ProvenanceContext = createContext([]);
export const DataContext = createContext({});
export const ExtractedFilesContext = createContext(new Map());
export const ExtractedTextsContext = createContext({});
export const RelationsContext = createContext([]);
export const EventsContext = createContext([]);
export const SchemaTypeContext = createContext("ta2");
export const nodeTypes = {
    eventNode: EventGraphNode,
    customNode: CustomNode,
    gate: Gate,
};

const defaultExtractedText = () => {
    const mapText = new Map();
    for (const [key, value] of Object.entries(defaultText.rsd_data.en)) {
        mapText.set(key, value);
    }
    return mapText;
};

const DataReader = () => {
    const [data, setData] = React.useState(defaultData);
    let jsonConvert = new JsonConvert();
    const [Entities, setEntities] = React.useState([]);
    const [Events, setEvents] = React.useState([]);
    const [Relations, setRelations] = React.useState([]);
    const [Provenances, setProvenances] = React.useState({});
    const [extractedFiles, setExtractedFiles] = React.useState(new Map());
    const [extractedTexts, setExtractedTexts] = React.useState(
        defaultExtractedText()
    );
    const [schemaType, setSchemaType] = React.useState("ta2");

    useEffect(() => {
        console.log("rawdata", data);
        console.log("schemaType", schemaType);
        // ta1 handling
        if (schemaType === "ta1") {
            if (data.events && data.events.length > 0) {
                setEvents(jsonConvert.deserializeArray(data.events, TA1Event));

                const entitiesMap = new Map();
                const relationList = [];
                data.events.forEach((event) => {
                    if (event.relations) {
                        event.relations.forEach((relation) => {
                            relationList.push(
                                jsonConvert.deserialize(relation, Relation)
                            );
                        });
                    }
                    if (event.entities) {
                        event.entities.forEach((entity) => {
                            entitiesMap.set(
                                entity["@id"],
                                jsonConvert.deserialize(entity, TA1Entity)
                            );
                        });
                    }
                });
                setEntities(entitiesMap);
                setRelations(relationList);
            }

            return;
        }
        // ta2 data handling
        if (data.instances) {
            if (data.instances[0].entities) {
                const entitiesMap = new Map();
                jsonConvert
                    .deserializeArray(data.instances[0].entities, Entity)
                    .forEach((entity) => {
                        entitiesMap.set(entity.id, entity);
                    });
                setEntities(entitiesMap);
            }
            if (data.instances[0].events) {
                setEvents(
                    jsonConvert.deserializeArray(
                        data.instances[0].events,
                        EventNode
                    )
                );
            }
        }

        if (data.provenanceData) {
            const mapProvenance = new Map();
            data.provenanceData
                .map(createProvenanceEntity)
                .forEach((provenance) => {
                    mapProvenance.set(provenance.id, provenance);
                });
            setProvenances(mapProvenance);
        }
    }, [data]);

    return (
        <div style={{ width: "100vw", height: "100vh" }}>
                <SchemaTypeContext.Provider value={[schemaType, setSchemaType]}>
                    <DataContext.Provider value={[data, setData]}>
                        <ProvenanceContext.Provider
                            value={[Provenances, setProvenances]}
                        >
                            <EventsContext.Provider value={[Events, setEvents]}>
                                <EntitiesContext.Provider
                                    value={[Entities, setEntities]}
                                >
                                    <ExtractedTextsContext.Provider
                                        value={[
                                            extractedTexts,
                                            setExtractedTexts,
                                        ]}
                                    >
                                        <ExtractedFilesContext.Provider
                                            value={[
                                                extractedFiles,
                                                setExtractedFiles,
                                            ]}
                                        >
                                            <RelationsContext.Provider
                                                value={[
                                                    Relations,
                                                    setRelations,
                                                ]}
                                            >
                                                {schemaType === "ta2" ? (
                                                    <Graph />
                                                ) : (
                                                    <GraphTA1 />
                                                )}
                                            </RelationsContext.Provider>
                                        </ExtractedFilesContext.Provider>
                                    </ExtractedTextsContext.Provider>
                                </EntitiesContext.Provider>
                            </EventsContext.Provider>
                        </ProvenanceContext.Provider>
                    </DataContext.Provider>
                </SchemaTypeContext.Provider>
        </div>
    );
};
export default DataReader;
