import axios from "axios";
import { JsonConvert } from "json2typescript";
import React, { useEffect, useState } from "react";
import AsyncSelect from "react-select/async";
import { UniqueString } from "../utils/TypeScriptUtils";
import EditableText from "../CustomizedComponents/EditableText/EditableText";
import useStoreTA1 from "./storeTA1";
import { TA1Entity } from "./LibraryTA1";

export function TA1TableInfoPanel({
    data, parentId, editMode = false, schemaType = "ta1",
}) {
    const [tableChange, setTableChange] = useState(false);
    const [showAllEntities, setShowAllEntities] = useState(
        schemaType === "ta1"
    );
    const [editMapNode, mapNodes, entitiesRelatedEventMap, mapEntities] = useStoreTA1((state) => [
        state.editMapNode,
        state.mapNodes,
        state.entitiesRelatedEventMap,
        state.mapEntities,
    ]);
    const [editNode, setEditNode] = useState(null);
    const loadOptions = async (inputValue, callback) => {
        // if (!inputValue) return callback([]);
        const options = [];
        entitiesRelatedEventMap.forEach((entity, key) => {
            options.push({
                value: key,
                label: mapEntities.get(key).name,
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
                    <h3>{entity.label}</h3>
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
        console.log("dataoverhere", data);
        console.log("parentId", parentId);
        return data.map((participant) => {
            // console.log("entitiesMap", mapEntities);
            const entityObject = mapEntities.get(participant.entity);
            return {
                id: participant.id,
                entities: (
                    <React.Fragment>
                        {editNode !== null && participant.id === editNode.id ? (
                            <AsyncSelect
                                loadOptions={loadOptions}
                                defaultOptions
                                value={{
                                    value: participant.entity,
                                    label: entityObject.name,
                                }}
                                onChange={(object) => {
                                    console.log("object", object);
                                    if (mapEntities.has(object.value)) {
                                        participant.entity = object.value;
                                        editMapNode(
                                            parentId,
                                            "participants",
                                            mapNodes
                                                .get(parentId)
                                                .participants.map((part) => {
                                                    if (part.id ===
                                                        participant.id) {
                                                        return participant;
                                                    } else {
                                                        return part;
                                                    }
                                                })
                                        );
                                    } else {
                                        const JsonConverter = new JsonConvert();
                                        const newEntity = {
                                            "@id": UniqueString.getUniqueStringWithForm(
                                                "resin:Entity/",
                                                "/"
                                            ),
                                            name: object.data.name,
                                            wd_node: object.data.wd_node,
                                            wd_label: object.data.wd_label,
                                            wd_description: object.data.wd_description,
                                        };
                                        mapEntities.set(
                                            newEntity["@id"],
                                            JsonConverter.deserializeObject(
                                                newEntity,
                                                TA1Entity
                                            )
                                        );
                                        participant.entity = newEntity["@id"];
                                        editMapNode(
                                            parentId,
                                            "participants",
                                            mapNodes
                                                .get(parentId)
                                                .participants.map((part) => {
                                                    if (part.id ===
                                                        participant.id) {
                                                        return participant;
                                                    } else {
                                                        return part;
                                                    }
                                                })
                                        );
                                    }
                                }} />
                        ) : (
                            <EditableText
                                values={entityObject.name}
                                onSave={(value, field) => {
                                    entityObject.name = value;
                                    mapEntities.set(
                                        entityObject.id,
                                        entityObject
                                    );
                                    setTableChange(!tableChange);
                                }}
                                wdData={{
                                    wd_node: entityObject.wd_node,
                                    wd_label: entityObject.wd_label,
                                    wd_description: entityObject.wd_description,
                                }}
                                variant="none"
                                onTable={true} />
                        )}
                    </React.Fragment>
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
                                            // edit the entity
                                            // console.log(
                                            //     "participant",
                                            //     participant
                                            // );
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
        </div>
    );
}
