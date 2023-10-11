import { JsonConvert } from "json2typescript";
import React, { useContext, useState } from "react";
import EditableText from "../CustomizedComponents/EditableText/EditableText.jsx";
import { Modal } from "../CustomizedComponents/Modal/Modal";
import { EntitiesContext } from "../DataReadingComponents/DataReader";
import ProvenancePopup from "../PageComponents/ProvenancePopUp/ProvenancePopup.jsx";
import { UniqueString } from "../utils/TypeScriptUtils";
import { Entity, Participant } from "./Library";
import { TA2EditEventPanel } from "./TA2EditEventPanel";
import { TA2TableInfoPanel } from "./TA2TableInfoPanel";
import useStore from "./store";

export function TA2EventNodeInfoPanel({ data, onClose }) {
    const [isEnlarged, setIsEnlarged] = useState(false);
    const [showProvenance, setShowProvenance] = useState(false);
    const editMapNode = useStore((state) => state.editMapNode);
    const [showEditPanel, setShowEditPanel] = useState(false);
    const [timeFrame, setTimeFrame] = useState(Date.now());
    const [Entities] = useContext(EntitiesContext);
    const [editMode, setEditMode] = useState(false);

    if (data === undefined) {
        return <></>;
    }

    const toggleEnlarged = () => {
        setIsEnlarged(!isEnlarged);
    };
    const toggleProvenance = () => {
        setShowProvenance(!showProvenance);
    };

    const provenanceExisted = data.provenance && data.provenance.length > 0;
    const handleOnSave = (value, field, index = -1) => {
        editMapNode(data.id, field, value, index);
    };
    return (
        <div
            className={isEnlarged ? "info-panel-enlarge" : "info-panel"}
            key={timeFrame}
        >
            <Modal
                isEnlarged={isEnlarged}
                toggleEnlarged={toggleEnlarged}
                handleClick={onClose}
                handleEdit={() => {
                    setShowEditPanel(!showEditPanel);
                }}
            />

            {data.name && (
                <EditableText
                    values={data.name}
                    variant="h2"
                    onSave={handleOnSave}
                    field="name"
                />
            )}
            {data.description && (
                <EditableText
                    values={data.description}
                    variant="p"
                    onSave={handleOnSave}
                    field="description"
                />
            )}
            {provenanceExisted && (
                <a onClick={toggleProvenance}>
                    <u>
                        <h3>Show Source</h3>
                    </u>
                </a>
            )}
            {showProvenance && provenanceExisted && (
                <ProvenancePopup
                    ids={data.provenance}
                    onClose={toggleProvenance}
                    parentId={data.id}
                />
            )}
            {data.wdNode && data.wdNode !== null && data.wdNode !== "null" && (
                <details open>
                    <summary
                        style={{
                            fontWeight: "bold",
                            cursor: "pointer",
                        }}
                    >
                        Event Type
                    </summary>
                    {data.wdNode.map((node, index) => (
                        <div key={node}>
                            <EditableText
                                values={data.wdLabel[index]}
                                variant="h3"
                                index={index}
                                onSave={handleOnSave}
                                field="wdLabel"
                            />
                            <EditableText
                                values={data.wdDescription[index]}
                                variant="p"
                                index={index}
                                onSave={handleOnSave}
                                field="wdDescription"
                            />
                        </div>
                    ))}
                </details>
            )}

            {data.participants && data.participants.length > 0 && (
                <details open>
                    <summary
                        style={{
                            fontWeight: "bold",
                            cursor: "pointer",
                        }}
                    >
                        Participants
                    </summary>
                    <TA2TableInfoPanel
                        data={data.participants}
                        parentId={data.id}
                        editMode={editMode}
                    />
                </details>
            )}
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "left",
                    gap: "10px",
                }}
            >
                {
                    <button
                        className="anchor-button"
                        onClick={() => {
                            const jsonConvert = new JsonConvert();
                            const newParticipantId =
                                UniqueString.getUniqueStringWithForm(
                                    "resin:Participant/",
                                    "/"
                                );
                            const newEntityId =
                                UniqueString.getUniqueStringWithForm(
                                    "resin:Entity/",
                                    "/"
                                );
                            const newEntity = jsonConvert.deserializeObject(
                                {
                                    "@id": newEntityId,
                                    name: "NewEntity",
                                    description: "",
                                    provenance: [],
                                    ta2wdNode: [],
                                    ta2wdLabel: "",
                                    ta2wdDescription: "",
                                    optional: false,
                                },
                                Entity
                            );
                            Entities.set(newEntityId, newEntity);

                            // console.log("newParticipantId", newParticipantId);
                            const newParticipant =
                                jsonConvert.deserializeObject(
                                    {
                                        "@id": newParticipantId,
                                        roleName: "new Role",
                                        entity: newEntityId,
                                    },
                                    Participant
                                );

                            data.participants.push(newParticipant);
                            editMapNode(
                                data.id,
                                "participants",
                                data.participants
                            );
                            setTimeFrame(Date.now());
                        }}
                    >
                        <h4>
                            <span className="fa fa-plus" />
                            {" Add Participant"}
                        </h4>
                    </button>
                }
                {data.participants && data.participants.length > 0 && (
                    <button
                        className="anchor-button"
                        onClick={() => {
                            setEditMode(!editMode);
                        }}
                    >
                        <h4>
                            <span className="fa fa-edit" />
                            {editMode ? " Close Edit Table" : " Edit Table"}
                        </h4>
                    </button>
                )}
            </div>
            {showEditPanel && (
                <TA2EditEventPanel
                    onClose={() => {
                        setShowEditPanel(false);
                    }}
                    isEnlarged={isEnlarged}
                    toggleEnlarged={toggleEnlarged}
                    existingData={data}
                />
            )}
        </div>
    );
}
