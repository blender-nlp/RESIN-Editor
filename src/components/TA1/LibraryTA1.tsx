import React, { ReactElement } from "react";
import { JsonObject, JsonProperty } from "json2typescript";
import {
    ForceNumberArray,
    ForceStringArray,
    LowerCaseString,
    UniqueString,
} from "../utils/TypeScriptUtils";
import { Handle, Position } from "reactflow";
import "./LibraryTA1.css";

export type TreeRenderOptions = {
    leafNode?: string;
    parentNode?: string;
    entityNode?: string;
};

export abstract class TA1NodeRenderingStrategy {
    protected node: {
        id: string;
        type: string;
        description: String;
        subgroupEvents: String[];
    };
    static nodeOptions: TreeRenderOptions = {
        leafNode: "circle",
        parentNode: "diamond",
        entityNode: "square",
    };

    abstract get color(): string;

    get border(): string {
        return "solid";
    }

    get shape(): string {
        if (this.node.type === "entity") {
            return TA1NodeRenderingStrategy.nodeOptions.entityNode
                ? TA1NodeRenderingStrategy.nodeOptions.entityNode
                : "square";
        } else if (this.node.type === "parent") {
            return TA1NodeRenderingStrategy.nodeOptions.parentNode
                ? TA1NodeRenderingStrategy.nodeOptions.parentNode
                : "diamond";
        } else {
            return TA1NodeRenderingStrategy.nodeOptions.leafNode
                ? TA1NodeRenderingStrategy.nodeOptions.leafNode
                : "circle";
        }
    }

    get size(): number {
        return 50;
    }
    constructor(parsednode: TA1Event | TA1Entity) {
        if (parsednode instanceof TA1Entity) {
            this.node = {
                id: parsednode.id ? parsednode.id : "",
                type: "entity",
                description: parsednode.wd_description
                    ? parsednode.wd_description[0]
                    : "",
                subgroupEvents: [],
            };
        } else {
            this.node = {
                id: parsednode.id ? parsednode.id : "",
                type:
                    parsednode.children && parsednode.children.length > 0
                        ? "parent"
                        : "child",
                description: parsednode.description
                    ? parsednode.description
                    : "",
                subgroupEvents: parsednode.children ? parsednode.children : [],
            };
        }
    }

    render(isConnectable: boolean | undefined): ReactElement {
        return (
            <div
                className="hover-container"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <span className="hover-text">{this.node.description}</span>
                {this.shape === "diamond" ? (
                    <div
                        className="diamond"
                        style={{
                            position: "relative",
                            width: `${this.size}px`,
                            height: `${this.size}px`,
                            margin: `${this.size}px auto`,
                            border: `2px ${this.border} black`,
                            borderBottomColor: "#000",
                            backgroundColor: this.color,
                            transform: "rotate(45deg)",
                        }}
                    >
                        <div
                            className="diamond__inner"
                            style={{
                                position: "absolute",
                                top: `-${this.size * 0.28}px`,
                                left: `-${this.size * 0.28}px`,
                                right: `-${this.size * 0.28}px`,
                                bottom: `-${this.size * 0.28}px`,
                                transform: "rotate(-45deg)",
                                backgroundColor: "none",
                            }}
                        >
                            <Handle
                                type="target"
                                position={Position.Top}
                                style={{ background: "#555" }}
                                onConnect={(params) =>
                                    console.log("handle onConnect", params)
                                }
                                isConnectable={isConnectable}
                            />
                            <Handle
                                type="source"
                                position={Position.Bottom}
                                style={{ background: "#555" }}
                                onConnect={(params) =>
                                    console.log("handle onConnect", params)
                                }
                                isConnectable={isConnectable}
                            />
                            <Handle
                                type="target"
                                position={Position.Left}
                                id={this.node.id + "_left"}
                                style={{ background: "#555" }}
                                onConnect={(params) =>
                                    console.log("handle onConnect", params)
                                }
                                isConnectable={isConnectable}
                            />

                            <Handle
                                type="source"
                                position={Position.Right}
                                style={{ background: "#555" }}
                                id={this.node.id + "_right"}
                                onConnect={(params) =>
                                    console.log("handle onConnect", params)
                                }
                                isConnectable={isConnectable}
                            />
                        </div>
                    </div>
                ) : this.shape === "square" ? (
                    <div
                        className="square"
                        style={{
                            position: "relative",
                            width: `${this.size}px`,
                            height: `${this.size}px`,
                            margin: `${this.size}px auto`,
                            border: `2px ${this.border} black`,
                            borderBottomColor: "#000",
                            backgroundColor: this.color,
                        }}
                    >
                        <Handle
                            type="target"
                            position={Position.Top}
                            id={this.node.id}
                            style={{ background: "#555" }}
                            onConnect={(params) =>
                                console.log("handle onConnect", params)
                            }
                            isConnectable={isConnectable}
                        />
                        <Handle
                            type="source"
                            position={Position.Bottom}
                            id={this.node.id}
                            style={{ background: "#555" }}
                            onConnect={(params) =>
                                console.log("handle onConnect", params)
                            }
                            isConnectable={isConnectable}
                        />
                        <Handle
                            type="target"
                            id={this.node.id + "_left"}
                            position={Position.Left}
                            style={{ background: "#555" }}
                            onConnect={(params) =>
                                console.log("handle onConnect", params)
                            }
                            isConnectable={isConnectable}
                        />

                        <Handle
                            type="source"
                            position={Position.Right}
                            id={this.node.id + "_right"}
                            style={{ background: "#555" }}
                            onConnect={(params) =>
                                console.log("handle onConnect", params)
                            }
                            isConnectable={isConnectable}
                        />
                    </div>
                ) : (
                    <div
                        style={{
                            position: "relative",
                            width: this.size,
                            height: this.size,
                            backgroundColor: this.color || "white",
                            border: `3px ${this.border} black`,
                            borderRadius: "50%",
                        }}
                    >
                        <Handle
                            type="target"
                            position={Position.Top}
                            id={this.node.id}
                            style={{ background: "#555" }}
                            onConnect={(params) =>
                                console.log("handle onConnect", params)
                            }
                            isConnectable={isConnectable}
                        />
                        <Handle
                            type="source"
                            position={Position.Bottom}
                            id={this.node.id}
                            style={{ background: "#555" }}
                            onConnect={(params) =>
                                console.log("handle onConnect", params)
                            }
                            isConnectable={isConnectable}
                        />
                        <Handle
                            type="target"
                            id={this.node.id + "_left"}
                            position={Position.Left}
                            style={{ background: "#555" }}
                            onConnect={(params) =>
                                console.log("handle onConnect", params)
                            }
                            isConnectable={isConnectable}
                        />

                        <Handle
                            type="source"
                            position={Position.Right}
                            id={this.node.id + "_right"}
                            style={{ background: "#555" }}
                            onConnect={(params) =>
                                console.log("handle onConnect", params)
                            }
                            isConnectable={isConnectable}
                        />
                    </div>
                )}
            </div>
        );
    }
}

@JsonObject("TA1Entity")
export class TA1Entity {
    @JsonProperty("@id", String)
    id: string = undefined!;

    @JsonProperty("name", String)
    name: string = undefined!;

    @JsonProperty("wd_node", ForceStringArray, true)
    wd_node?: string[];

    @JsonProperty("wd_label", ForceStringArray, true)
    wd_label?: string[];

    @JsonProperty("wd_description", ForceStringArray, true)
    wd_description?: string[];


    constructor(
        id: string,
        name: string,
        wd_node: string[] = undefined!,
        wd_label: string[] = undefined!,
        wd_description: string[] = undefined!
    ) {
        this.id = id;
        this.name = name;
        this.wd_node = wd_node;
        this.wd_label = wd_label;
        this.wd_description = wd_description;
    }

    get renderStrategy(): TA1NodeRenderingStrategy {
        return new TA1EntityStrategy(this);
    }
    render(isConnectable: boolean | undefined) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}>
                {this.renderStrategy.render(isConnectable)}
                <h1>{parseInt(this.id.replace(/^\D+/g, ''))}</h1>
                <div
                    className=" font-bold"
                    style={{
                        fontSize: "1.5rem",
                        width: "fit-content",
                        maxInlineSize: "200px",
                        overflowWrap: "anywhere",
                        textAlign: "center",
                        hyphens: "auto",
                    }}
                >
                    {this.name}
                </div>
            </div>
        );
    }
}

@JsonObject("Relation")
export class Relation {
    @JsonProperty("@id", String)
    id: string = undefined!;
    @JsonProperty("name", String)
    name: string = undefined!;
    @JsonProperty("wd_node", ForceStringArray, true)
    wd_node?: string[];
    @JsonProperty("wd_label", ForceStringArray, true)
    wd_label?: string[];
    @JsonProperty("wd_description", ForceStringArray, true)
    wd_description?: string[];
    @JsonProperty("relationSubject", String, true)
    relationSubject: string;
    @JsonProperty("relationObject", String, true)
    relationObject: string;

    constructor(
        id: string,
        name: string,
        wd_node: string[] = undefined!,
        wd_label: string[] = undefined!,
        wd_description: string[] = undefined!,
        relationSubject: string = undefined!,
        relationObject: string = undefined!
    ) {
        this.id = id;
        this.name = name;
        this.wd_node = wd_node;
        this.wd_label = wd_label;
        this.wd_description = wd_description;
        this.relationSubject = relationSubject;
        this.relationObject = relationObject;
    }
}

export class TA1EventStrategy extends TA1NodeRenderingStrategy {
    static colorOptions: string = "#56B4E9";
    get color(): string {
        return TA1EventStrategy.colorOptions
    }
}

export class TA1EntityStrategy extends TA1NodeRenderingStrategy {
    static colorOptions: string = "#D55E00";
    get color(): string {
        return TA1EntityStrategy.colorOptions
    }
}
@JsonObject("TA1Participant")
export class TA1Participant {
    @JsonProperty("@id", UniqueString)
    id: string;

    @JsonProperty("entity", String, true)
    entity: string;

    @JsonProperty("roleName", String, true)
    roleName: string;

    constructor(id: string, entity: string, roleName: string) {
        this.id = id;
        this.entity = entity;
        this.roleName = roleName;
    }
    render(isConnectable: boolean | undefined): ReactElement {
        return (
            <div
                style={{
                    width: 50,
                    height: 50,
                    backgroundColor: "green",
                }}
            >
                <Handle
                    type="target"
                    position={Position.Top}
                    id={this.id}
                    style={{ background: "#555" }}
                    onConnect={(params) =>
                        console.log("handle onConnect", params)
                    }
                    isConnectable={isConnectable}
                />
                <Handle
                    type="source"
                    position={Position.Bottom}
                    id={this.id}
                    style={{ background: "#555" }}
                    onConnect={(params) =>
                        console.log("handle onConnect", params)
                    }
                    isConnectable={isConnectable}
                />
                <text>ID: {this.id}</text>
                <text>TA1Entity: {this.entity}</text>
                <text>RoleName: {this.roleName}</text>
            </div>
        );
    }
}
@JsonObject("TA1Event")
export class TA1Event {
    @JsonProperty("@id", UniqueString, true)
    id?: string;

    @JsonProperty("name", String, true)
    name?: string;

    @JsonProperty("description", String, true)
    description?: String;

    @JsonProperty("children", [String], true)
    children?: string[];

    @JsonProperty("children_gate", LowerCaseString, true)
    childrenGate?: string;

    @JsonProperty("outlinks", [String], true)
    outlinks?: string[];

    @JsonProperty("importance", ForceNumberArray, true)
    importance?: number[];

    @JsonProperty("likelihood", ForceNumberArray, true)
    likelihood?: number[];

    @JsonProperty("entities", [TA1Entity], true)
    entities?: TA1Entity[];
    @JsonProperty("wd_node", ForceStringArray, true)
    wdNode?: string[];

    @JsonProperty("wd_label", ForceStringArray, true)
    wdLabel?: string[];

    @JsonProperty("wd_description", ForceStringArray, true)
    wdDescription?: string[];

    @JsonProperty("participants", [TA1Participant], true)
    participants?: TA1Participant[];

    @JsonProperty("isSchema", Boolean, true)
    isSchema?: boolean;

    @JsonProperty("repeatable", Boolean, true)
    repeatable?: boolean;

    @JsonProperty("relations", [Relation], true)
    relations?: Relation[];

    @JsonProperty("optional", Boolean, true)
    optional?: boolean;

    get renderStrategy(): TA1NodeRenderingStrategy {
        return new TA1EventStrategy(this);
    }
    render(isConnectable: boolean | undefined): ReactElement {
        // console.log("Rendering node: " + this.id);
        return (
            <div>
                {this.renderStrategy.render(isConnectable)}
                <div
                    className=" font-bold"
                    style={{
                        fontSize: "1.5rem",
                        width: "fit-content",
                        maxInlineSize: "200px",
                        overflowWrap: "anywhere",
                        textAlign: "center",
                        hyphens: "auto",
                    }}
                >
                    {this.name}
                </div>
            </div>
        );
    }

    relatedEntities(): string[] {
        return this.entities?.map((entity) => entity.id) ?? [];
    }
}
