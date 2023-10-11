import axios from "axios";
import { JsonConvert } from "json2typescript";
import React, { useContext, useEffect, useState } from "react";
import AsyncSelect from "react-select/async";
import { Entity } from "./Library";
import ProvenancePopup from "../PageComponents/ProvenancePopUp/ProvenancePopup.jsx";
import { UniqueString } from "../utils/TypeScriptUtils";
import { EntitiesContext } from "../DataReadingComponents/DataReader";
import EditableText from "../CustomizedComponents/EditableText/EditableText.jsx";
import useStore from "./store";

export function TA2TableInfoPanel({
    data, parentId, editMode = false, schemaType = "ta2",
}) {
    const [entitiesMap] = useContext(EntitiesContext);
    const [showProvenance, setShowProvenance] = useState(false);
    const [keyProvenance, setKeyProvenance] = useState(null);
    const [currentProvenance, setCurrentProvenance] = useState(null);
    const [tableChange, setTableChange] = useState(false);
    const [showAllEntities, setShowAllEntities] = useState(
        schemaType === "ta1"
    );
    const [query, setQuery] = useState("");
    const [editMapNode, mapNodes, entitiesRelatedEventMap] = useStore(
        (state) => [
            state.editMapNode,
            state.mapNodes,
            state.entitiesRelatedEventMap,
        ]
    );

    const [editNode, setEditNode] = useState(null);
    const closeProvenance = () => {
        setShowProvenance(false);
    };
    const openProvenanceMap = (provenanceIds, key) => {
        // Add logic here to open the provenance map with the specified provenanceId
        // console.log(`Opening provenance map for id: ${provenanceId}`);
        if (provenanceIds instanceof Array && provenanceIds.length > 0) {
            setCurrentProvenance(provenanceIds);
            setKeyProvenance(key);
            setShowProvenance(true);
        } else if (provenanceIds instanceof String) {
            setCurrentProvenance([provenanceIds]);
            setKeyProvenance(key);
            setShowProvenance(true);
        }
    };
    const loadOptions = async (inputValue, callback) => {
        // if (!inputValue) return callback([]);
        const options = [];
        entitiesRelatedEventMap.forEach((entity, key) => {
            options.push({
                value: key,
                label: entitiesMap.get(key).name,
            });
        });
        if (!inputValue) {
            setTimeout(
                () => callback([
                    {
                        label: "Existing Entities",
                        options: options,
                    },
                    {
                        label: "New Entities",
                        options: [],
                    },
                ]),
                1000
            );
        }

        // fetch Wikidata entities
        const response = await axios.get("https://www.wikidata.org/w/api.php", {
            params: {
                action: "wbsearchentities",
                search: inputValue,
                language: "en",
                format: "json",
                origin: "*", // Necessary for CORS
            },
        });
        console.log("response", response);
        const listNewOptions = response.data.search.map((entity) => ({
            value: entity.id,
            label: (
                <React.Fragment>
                    <h4>{entity.label}</h4>
                    <p>{entity.description}</p>
                </React.Fragment>
            ),
            data: {
                name: entity.label,
                wd_node: "wd:" + entity.id,
                wd_label: entity.label,
                wd_description: entity.description,
            },
        }));
        const totalOptions = [
            {
                label: "Existing Entities",
                options: options.filter((option) => option.label
                    .toLowerCase()
                    .includes(inputValue.toLowerCase())
                ),
            },
            {
                label: "New Entities",
                options: listNewOptions,
            },
        ];
        return callback(totalOptions);
    };

    const getDisplayParticipantArray = (data, parentId, showAllEntities) => {
        return data.map((participant) => {
            const entityObject = entitiesMap.get(
                participant.entity ? participant.entity : participant.ta2entity
            );
            const values = [];
            if (editNode !== null && participant.id === editNode.id) {
                if (participant.values && participant.values instanceof Array) {
                    values.push(
                        ...participant.values.map((value) => {
                            const valueEntity = entitiesMap.get(
                                value.ta2entity
                            );
                            return {
                                value: valueEntity.id,
                                label: valueEntity.name,
                            };
                        })
                    );
                }
                return {
                    id: participant.id,
                    entities: (
                        <AsyncSelect
                            loadOptions={loadOptions}
                            value={values}
                            defaultOptions
                            onInputChange={(value) => {
                                console.log("value", value);
                                setQuery(value);
                            }}
                            isMulti
                            onChange={(valueList) => {
                                const values = [];
                                // console.log("value", valueList);
                                valueList.forEach((value) => {
                                    let foundInOldArray = false;
                                    participant.values?.forEach((partValue) => {
                                        if (partValue.ta2entity === value.value) {
                                            values.push(partValue);
                                            foundInOldArray = true;
                                        }
                                    });
                                    if (foundInOldArray === false) {
                                        console.log("value", value);
                                        if (value.data) {
                                            const JsonConverter = new JsonConvert();
                                            const newEntity = {
                                                "@id": UniqueString.getUniqueStringWithForm(
                                                    "resin:Entity/",
                                                    "/"
                                                ),
                                                name: value.data.name,
                                                wd_node: value.data.wd_node,
                                                wd_label: value.data.wd_label,
                                                wd_description: value.data.wd_description,
                                            };
                                            entitiesMap.set(
                                                newEntity["@id"],
                                                JsonConverter.deserializeObject(
                                                    newEntity,
                                                    Entity
                                                )
                                            );
                                            const newValue = {
                                                "@id": UniqueString.getUniqueStringWithForm(
                                                    "resin:Value/",
                                                    "/"
                                                ),
                                                ta2entity: newEntity["@id"],
                                            };
                                            values.push(newValue);
                                        } else {
                                            const newEntity = entitiesMap.get(
                                                value.value
                                            );
                                            const newValue = {
                                                "@id": UniqueString.getUniqueStringWithForm(
                                                    "resin:Value/",
                                                    "/"
                                                ),
                                                ta2entity: newEntity.id,
                                            };
                                            values.push(newValue);
                                        }
                                    }
                                    // console.log("newvalues", values);
                                });
                                participant.values = values;
                                editMapNode(
                                    parentId,
                                    "participants",
                                    mapNodes
                                        .get(parentId)
                                        .participants.map((part) => {
                                            if (part.id === participant.id) {
                                                return participant;
                                            } else {
                                                return part;
                                            }
                                        })
                                );
                                setTableChange(!tableChange);
                            }} />
                    ),
                    roleName: (
                        <React.Fragment>
                            <EditableText
                                values={participant.roleName}
                                onSave={(value, field) => {
                                    participant.roleName = value;
                                    editMapNode(
                                        parentId,
                                        "participants",
                                        mapNodes
                                            .get(parentId)
                                            .participants.map((part) => {
                                                if (part.id === participant.id) {
                                                    return participant;
                                                } else {
                                                    return part;
                                                }
                                            })
                                    );
                                    setTableChange(!tableChange);
                                }}
                                variant="none"
                                onTable={true} />
                        </React.Fragment>
                    ),
                };
            }

            if (showAllEntities && entityObject.name) {
                values.push(
                    <EditableText
                        values={entityObject.name}
                        onSave={(value, field) => {
                            entityObject.name = value;
                            entitiesMap.set(entityObject.id, entityObject);
                            setTableChange(!tableChange);
                        }}
                        wdData={{
                            wd_node: entityObject.wd_node,
                            wd_label: entityObject.wd_label,
                            wd_description: entityObject.wd_description,
                        }}
                        variant="none"
                        onTable={true} />
                );
            }

            if (participant.values && participant.values instanceof Array) {
                participant.values?.forEach((value) => {
                    const valueEntity = entitiesMap.get(value.ta2entity);
                    if (valueEntity === undefined) {
                        return;
                    }
                    if (value.provenance) {
                        // Add a clickable text to open the provenance map
                        // console.log("valueEntity", valueEntity);
                        values.push(
                            <EditableText
                                values={valueEntity.name}
                                onSave={(value, field) => {
                                    valueEntity.name = value;
                                    entitiesMap.set(
                                        valueEntity.id,
                                        valueEntity
                                    );
                                    setTableChange(!tableChange);
                                }}
                                variant="span"
                                id={value.ta2entity}
                                // wdData={{
                                //     wd_node: valueEntity.ta2wd_node,
                                //     wd_label: valueEntity.ta2wd_label
                                //     ,
                                //     wd_description:
                                //         valueEntity.ta2wd_description,
                                // }}
                                className="clickable-text"
                                onClick={() => openProvenanceMap(value.provenance, [
                                    parentId,
                                    participant.id,
                                    value.id,
                                ])}
                                onTable={true} />
                        );
                    } else {
                        values.push(
                            <EditableText
                                values={valueEntity.name}
                                onSave={(value, field) => {
                                    valueEntity.name = value;
                                    entitiesMap.set(
                                        valueEntity.id,
                                        valueEntity
                                    );
                                    setTableChange(!tableChange);
                                }}
                                wdData={{
                                    wdNode: valueEntity.wd_node,
                                    wdLabel: valueEntity.wd_label,
                                    wdDescription: valueEntity.wd_description,
                                }}
                                variant="none"
                                onTable={true} />
                        );
                    }
                });
            }

            return {
                id: participant.id,
                entities: values && values.length > 0
                    ? values.map((value, index) => (
                        <React.Fragment key={index}>
                            {index > 0 && ", "}
                            {value}
                        </React.Fragment>
                    ))
                    : "-",
                roleName: (
                    <React.Fragment>
                        <EditableText
                            values={participant.roleName}
                            onSave={(value, field) => {
                                participant.roleName = value;
                                editMapNode(
                                    parentId,
                                    "participants",
                                    mapNodes
                                        .get(parentId)
                                        .participants.map((part) => {
                                            if (part.id === participant.id) {
                                                return participant;
                                            } else {
                                                return part;
                                            }
                                        })
                                );
                                setTableChange(!tableChange);
                            }}
                            variant="none"
                            onTable={true} />
                    </React.Fragment>
                ),
            };
        });
    };

    const [displayParticipantArray, setDisplayParticipantArray] = useState(
        getDisplayParticipantArray(data, parentId)
    );

    useEffect(() => {
        setDisplayParticipantArray(
            getDisplayParticipantArray(data, parentId, showAllEntities)
        );
    }, [showAllEntities, tableChange, data, parentId, editNode]);
    return (
        <div>
            <table>
                <thead>
                    <tr>
                        <th>Role</th>
                        <th>
                            Filler{" "}
                            {showAllEntities ? (
                                <span
                                    className="fa fa-chevron-down"
                                    onClick={() => {
                                        setShowAllEntities(false);
                                    }}
                                ></span>
                            ) : (
                                <span
                                    className="fa fa-chevron-up"
                                    onClick={() => {
                                        setShowAllEntities(true);
                                    }}
                                ></span>
                            )}
                        </th>
                        {editMode && (
                            <th
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    justifyContent: "space-evenly",
                                }}
                            >
                                Actions
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {displayParticipantArray.map((participant) => (
                        <tr key={participant.id}>
                            <td>{participant.roleName}</td>
                            <td>{participant.entities}</td>
                            {editMode && (
                                <td
                                    style={{
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "space-evenly",
                                    }}
                                >
                                    <span
                                        className="fa fa-arrow-up new-style-button"
                                        onClick={() => {
                                            // move the entity up
                                            const index = data.findIndex(
                                                (part) => part.id === participant.id
                                            );
                                            if (index > 0) {
                                                const temp = data[index - 1];
                                                data[index - 1] = data[index];
                                                data[index] = temp;
                                                editMapNode(
                                                    parentId,
                                                    "participants",
                                                    data
                                                );
                                                setTableChange(!tableChange);
                                            }
                                        }}
                                    ></span>
                                    <span
                                        className="fa fa-arrow-down new-style-button"
                                        onClick={() => {
                                            // move the entity down
                                            const index = data.findIndex(
                                                (part) => part.id === participant.id
                                            );
                                            if (index < data.length - 1) {
                                                const temp = data[index + 1];
                                                data[index + 1] = data[index];
                                                data[index] = temp;
                                                editMapNode(
                                                    parentId,
                                                    "participants",
                                                    data
                                                );
                                                setTableChange(!tableChange);
                                            }
                                        }}
                                    ></span>
                                    <span
                                        className="fa fa-edit new-style-button"
                                        onClick={() => {
                                            if (editNode !== null &&
                                                editNode.id === participant.id) {
                                                setEditNode(null);
                                            } else {
                                                setEditNode(participant);
                                            }
                                        }}
                                    ></span>
                                    <span
                                        className="fa fa-trash trash-button"
                                        onClick={() => {
                                            // delete the entity
                                            const index = data.findIndex(
                                                (part) => part.id === participant.id
                                            );
                                            if (index > -1) {
                                                data.splice(index, 1);
                                                editMapNode(
                                                    parentId,
                                                    "participants",
                                                    data
                                                );
                                                setTableChange(!tableChange);
                                            }
                                        }}
                                    ></span>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
            {showProvenance && (
                <ProvenancePopup
                    ids={currentProvenance}
                    onClose={closeProvenance}
                    parentId={keyProvenance} />
            )}
        </div>
    );
}
