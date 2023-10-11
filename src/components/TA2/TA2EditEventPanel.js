import { Slider } from "@mui/material";
import axios from "axios";
import { JsonConvert } from "json2typescript";
import React, { useEffect, useState } from "react";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { Modal } from "../CustomizedComponents/Modal/Modal";
import { EventNode } from "./Library";
import useStore from "./store";

export const TA2EditEventPanel = ({
    onClose,
    isEnlarged,
    toggleEnlarged,
    parentId,
    existingData,
    subgroupEvents = [],
    grouping = false,
}) => {
    const jsonConvert = new JsonConvert();
    const [
        getNewIdInEventMap,
        addEventNode,
        addNodeOnPanel,
        mapEntities,
        entitiesRelatedEventMap,
        mapNodes,
    ] = useStore((state) => [
        state.getNewIdInEventMap,
        state.addEventNode,
        state.addNodeOnPanel,
        state.mapEntities,
        state.entitiesRelatedEventMap,
        state.mapNodes,
    ]);

    const [data, setData] = useState(
        existingData
            ? jsonConvert.serializeObject(existingData)
            : {
                  "@id": getNewIdInEventMap(),
                  ta1ref: "",
                  name: "",
                  description: "",
                  parent: parentId,
                  children_gate: grouping ? "or" : undefined,
                  isTopLevel: parentId === "null",
                  subgroup_events: grouping ? subgroupEvents : [],
                  outlinks: [],
                  predictionProvenance: [],
                  confidence: 1,
                  wd_node: "",
                  wd_label: "",
                  wd_description: "",
                  provenance: [],
                  participants: [],
                  ta2wd_node: "",
                  ta2wd_label: "",
                  ta2wd_description: "",
                  optional: false,
              }
    );

    useEffect(() => {
        console.log("data", data);
    }, [data]);
    const handleChange = (e) => {
        setData({
            ...data,
            [e.target.name]: e.target.value,
        });
    };

    const handleArrayChange = (e) => {
        setData({
            ...data,
            [e.target.name]: e.target.value
                .split(",")
                .map((item) => item.trim()),
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (parentId === "null" && !grouping) {
            addNodeOnPanel(jsonConvert.deserializeObject(data, EventNode));
            onClose();
            return;
        }
        addEventNode(jsonConvert.deserializeObject(data, EventNode), grouping);
        onClose();
    };

    const loadOptions = async (inputValue, callback) => {
        const options = [];
        entitiesRelatedEventMap.forEach((entity, key) => {
            options.push({
                value: key,
                label: mapEntities.get(key).name,
            });
        });
        if (!inputValue) {
            setTimeout(
                () =>
                    callback([
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
                options: options.filter((option) =>
                    option.label
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

    return (
        <div className={isEnlarged ? "info-panel-enlarge" : "info-panel"}>
            <Modal
                isEnlarged={isEnlarged}
                toggleEnlarged={toggleEnlarged}
                handleClick={onClose}
            />
            {grouping ? (
                <h2>New Grouping Node</h2>
            ) : existingData ? (
                <h2>Edit Event</h2>
            ) : (
                <h2>Add A New Event</h2>
            )}
            <form onSubmit={handleSubmit} className="form-container">
                <div className="form-group">
                    <label>Id:</label>
                    <input
                        type="text"
                        name="@id"
                        value={data["@id"]}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label>Name:</label>
                    <input
                        type="text"
                        name="name"
                        value={data.name}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label>Ta1ref:</label>
                    <input
                        type="text"
                        name="ta1ref"
                        value={data.ta1ref}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label>Description:</label>
                    <textarea
                        name="description"
                        cdkTextareaAutosize
                        value={data.description}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label>Children Gate:</label>
                    <select
                        name="childrenGate"
                        value={data.childrenGate}
                        onChange={handleChange}
                    >
                        <option value="or">OR</option>
                        <option value="and">AND</option>
                        <option value="xor">XOR</option>
                        <option value={null}>NONE</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Parent:</label>
                    <Select
                        name="parent"
                        value={{
                            value: data.parent,
                            label: mapNodes.has(data.parent)
                                ? mapNodes.get(data.parent).name
                                : "kairos:NULL",
                        }}
                        onChange={(option) => {
                            setData({
                                ...data,
                                parent: option.value,
                            });
                        }}
                        options={Array.from(mapNodes.values()).map((event) => ({
                            value: event.id,
                            label: event.name,
                        }))}
                    />
                </div>

                <div className="form-group">
                    <label>Outlinks:</label>
                    <Select
                        isMulti
                        name="outlinks"
                        options={Array.from(mapNodes.values())
                            .filter((event) => event.id !== data.id)
                            .map((event) => ({
                                value: event.id,
                                label: event.name,
                            }))}
                        onChange={(selected) => {
                            setData({
                                ...data,
                                outlinks: selected.map((item) => item.value),
                            });
                        }}
                    />
                </div>
                <div className="form-group">
                    <label>Prediction Provenance (comma separated):</label>
                    <textarea
                        name="predictionProvenance"
                        cdkTextareaAutosize
                        onChange={handleArrayChange}
                        value={data.predictionProvenance}
                    />
                </div>
                <div className="form-group">
                    <label>Confidence</label>
                    <br />
                    <Slider
                        name="confidence"
                        value={data.confidence}
                        min={0}
                        max={1}
                        step={0.01}
                        style={{
                            width: "98%",
                            marginLeft: "1%",
                            color: "black",
                        }}
                        valueLabelDisplay="on"
                        onChange={(event, value) => {
                            // console.log("value", value);
                            setData({
                                ...data,
                                confidence: value,
                            });
                        }}
                    />
                </div>
                <div className="form-group">
                    <label>WikiData Nodes:</label>
                    <AsyncSelect
                        name="wd_node"
                        cacheOptions
                        defaultOptions
                        styles={{
                            width: "98%",
                            marginLeft: "1%",
                        }}
                        loadOptions={loadOptions}
                        isMulti
                        value={{
                            value: data.wd_node,
                            label: data.wd_label,
                        }}
                        onChange={(options) => {
                            console.log("option", options);
                            setData({
                                ...data,
                                wd_node: options.map((option) => {
                                    if (mapEntities.has(option.value)) {
                                        return mapEntities.get(option.value)
                                            .wd_node;
                                    }
                                    return option.data.wd_node;
                                }),
                                wd_label: options.map((option) => {
                                    if (mapEntities.has(option.value)) {
                                        return mapEntities.get(option.value)
                                            .name;
                                    }
                                    return option.data.name;
                                }),
                                wd_description: options.map((option) => {
                                    if (mapEntities.has(option.value)) {
                                        return mapEntities.get(option.value)
                                            .description;
                                    }
                                    return option.data.description;
                                }),
                            });
                        }}
                    />
                </div>
                <div className="form-group">
                    <label>Subgroup Events:</label>
                    <Select
                        name="subgroup_events"
                        value={data.subgroup_events.map((child) => ({
                            value: child,
                            label: mapNodes.get(child).name,
                        }))}
                        onChange={(options) => {
                            const subgroup_events = options.map(
                                (option) => option.value
                            );
                            setData({
                                ...data,
                                subgroup_events: subgroup_events,
                            });
                        }}
                        options={Array.from(mapNodes.values()).map((event) => ({
                            value: event.id,
                            label: event.name,
                        }))}
                        isMulti
                    />
                </div>
                <div className="form-group">
                    <label>Provenance (comma separated):</label>
                    <textarea
                        name="provenance"
                        cdkTextareaAutosize
                        value={data.provenance}
                        onChange={handleArrayChange}
                    />
                </div>
                <div className="form-group">
                    <label>TA2 WikiData Node:</label>
                    <AsyncSelect
                        name="ta2wd_node"
                        cacheOptions
                        defaultOptions
                        styles={{
                            width: "98%",
                            marginLeft: "1%",
                        }}
                        loadOptions={loadOptions}
                        value={{
                            value: data.ta2wd_node,
                            label: data.ta2wd_label,
                        }}
                        onChange={(options) => {
                            setData({
                                ...data,
                                ta2wd_node: options.map((option) => {
                                    if (mapEntities.has(option.value)) {
                                        return mapEntities.get(option.value)
                                            .wd_node;
                                    }
                                    return option.data.wd_node;
                                }),
                                ta2wd_label: options.map((option) => {
                                    if (mapEntities.has(option.value)) {
                                        return mapEntities.get(option.value)
                                            .name;
                                    }
                                    return option.data.name;
                                }),
                                ta2wd_description: options.map((option) => {
                                    if (mapEntities.has(option.value)) {
                                        return mapEntities.get(option.value)
                                            .description;
                                    }
                                    return option.data.description;
                                }),
                            });
                        }}
                    />
                </div>
                <div
                    sx={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                        border: "3px solid red",
                        borderRadius: "5px",
                        padding: "5px",
                    }}
                >
                    <button type="submit">
                        {existingData ? "Save Changes" : "Submit"}
                    </button>
                </div>
            </form>
        </div>
    );
};
