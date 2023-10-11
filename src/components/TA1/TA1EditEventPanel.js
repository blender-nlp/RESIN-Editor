import { Slider } from "@mui/material";
import axios from "axios";
import { JsonConvert } from "json2typescript";
import React, { useContext, useEffect, useState } from "react";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { Modal } from "../CustomizedComponents/Modal/Modal";
import { EventsContext } from "../DataReadingComponents/DataReader";
import { TA1Event } from "../TA1/LibraryTA1";
import useStoreTA1 from "./storeTA1";

export const TA1EditEventPanel = ({
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
        entitiesRelatedEventMap,
        mapEntities,
        mapNodes,
    ] = useStoreTA1((state) => [
        state.getNewIdInEventMap,
        state.addEventNode,
        state.addNodeOnPanel,
        state.entitiesRelatedEventMap,
        state.mapEntities,
        state.mapNodes,
    ]);
    const [data, setData] = useState(
        existingData
            ? jsonConvert.serializeObject(existingData)
            : {
                  "@id": getNewIdInEventMap(),
                  name: "newNode",
                  description: "",
                  children_gate: grouping && subgroupEvents.length > 0 ? "or" : undefined,
                  children: grouping ? subgroupEvents: [],
                  parent: parentId,
                  outlinks: [],
                  wd_node: [],
                  wd_label: [],
                  wd_description: [],
                  participants: [],
                  relations: [],
                  importance: 1,
                  likelihood: 1,
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

    const handleSubmit = (e) => {
        e.preventDefault();
        // console.log(data);
        if (parentId === "null" && !grouping) {
            addNodeOnPanel(jsonConvert.deserializeObject(data, TA1Event));
            onClose();
            return;
        }
        addEventNode(jsonConvert.deserializeObject(data, TA1Event), grouping, parentId);
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
                    <label>Description:</label>
                    <textarea
                        name="description"
                        cdkTextareaAutosize
                        value={data.description}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label style={{ display: "block" }}>Type:</label>
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
                    <label>Children:</label>
                    <Select
                        name="children"
                        value={data.children? data.children.map((child) => ({
                            value: child,
                            label: mapNodes.get(child).name,
                        })): []}
                        onChange={(options) => {
                            const childrenEvents = options.map(
                                (option) => option.value
                            );
                            setData({
                                ...data,
                                children: childrenEvents,
                            });
                        }}
                        options={Array.from(mapNodes.values()).map((event) => ({
                            value: event.id,
                            label: event.name,
                        }))}
                        isMulti
                    />
                </div>
                {data.children && data.children.length > 0 && (
                    <div className="form-group">
                        <label>Children Gate:</label>
                        <select
                            name="children_gate"
                            value={data.children_gate}
                            onChange={handleChange}
                        >
                            <option value="or">OR</option>
                            <option value="and">AND</option>
                            <option value="xor">XOR</option>
                            <option value={null}>NONE</option>
                        </select>
                    </div>
                )}

                <div className="form-group">
                    <label>Outlinks:</label>
                    <Select
                        name="outlinks"
                        value={
                            data.outlinks
                                ? data.outlinks.map((outlink) => ({
                                      value: outlink,
                                      label: mapNodes.get(outlink).name,
                                  }))
                                : []
                        }
                        onChange={(options) => {
                            const outlinksEvents = options.map(
                                (option) => option.value
                            );
                            setData({
                                ...data,
                                outlinks: outlinksEvents,
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
                    <label>Importance</label>
                    <br />
                    <Slider
                        name="importance"
                        value={data.importance}
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
                <div
                    className="form-group"
                    style={{
                        width: "100%",
                    }}
                >
                    <label>Likelihood</label>
                    <br />
                    <Slider
                        name="likelihood"
                        value={data.importance}
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
                            setData({
                                ...data,
                                confidence: value,
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
