
//********** */
// * Deprecated due to handling TA1 and TA2 differently
// ********** */
// *********
// * TA1 to TA2
// *********
export function convertTA1toTA2format(schemas: any): any {
    const entityList: object[] = [];
    const relationList: object[] = [];
    const parentMap: Map<string, string> = new Map();
    if (!schemas.hasOwnProperty("events")) {
        Error("No events");
    }
    schemas["events"] = schemas["events"].map((event: object) => {
        if (!event.hasOwnProperty("@id")) {
            Error("Event does not have @id");
        }
        const id = event["@id"] as string;
        if (event.hasOwnProperty("entities")) {
            const entities = event["entities"].map((entity: object) => {
                entityList.push(entity);
                return entity["@id"];
            });
            event["entities"] = entities;
        }
        if (event.hasOwnProperty("relations")) {
            console.log("relations", event["relations"]);
            const relations = event["relations"].map((relation: object) => {
                console.log("relation", relation);
                relationList.push(relation);
                return relation["@id"];
            });
            event["relations"] = relations;
        }
        if (event.hasOwnProperty("children")) {
            event["subgroup_events"] = event["children"];

            for (const child of event["children"]) {
                if (parentMap.has(child)) {
                    Error("Child already has a parent");
                }
                parentMap.set(child, id);
            }
            delete event["children"];
        }

        event["confidence"] = 1.0;
        event["predictionProvenance"] = [event["@id"]];
        return event;
    });
    schemas["events"] = schemas["events"].map((event: object) => {
        return {
            ...event,
            parent: parentMap.get(event["@id"])
                ? parentMap.get(event["@id"])
                : null,
            isTopLevel: parentMap.get(event["@id"]) === undefined,
        };
    });
    schemas["entities"] = entityList;
    schemas["relations"] = relationList;

    return {
        "@context": schemas["@context"],
        "@id": schemas["@id"].replace("TA1", "TA2"),
        ceID: schemas.hasOwnProperty("ceID")? schemas["ceID"]: "newCEID",
        instances: [schemas],
        version: schemas["version"],
        provenanceData: [],
    };
}
export function convertTA2toTA1format(schemas: any): any {
    const entityMap = new Map();
    const relationMap = new Map();
    const SourceOnlyEvents = new Set();
    if (!schemas.hasOwnProperty("instances")) {
        Error("No instances");
    }
    console.log("schemas", schemas["instances"]);
    schemas["instances"][0]["entities"].forEach((element) => {
        entityMap.set(element["@id"], element);
    });
    schemas["instances"][0]["relations"].forEach((element) => {
        relationMap.set(element["@id"], element);
    });
    schemas["instances"][0]["events"].forEach((event) => {
        if (
            event.hasOwnProperty("provenance") &&
            event.hasOwnProperty("ta1ref") &&
            event["ta1ref"] === "none"
        ) {
            SourceOnlyEvents.add(event["@id"]);
        }
    });
    console.log("entityMap", entityMap);
    console.log("relationMap", relationMap);
    
    delete schemas["instances"][0]["entities"];
    delete schemas["instances"][0]["relations"];
    const newSchema = schemas["instances"][0];

    newSchema["events"] = newSchema["events"]
        .map((event: object) => {
            if (!event.hasOwnProperty("@id")) {
                Error("Event does not have @id");
            }
            if (
                event.hasOwnProperty("provenance") &&
                event.hasOwnProperty("ta1ref") &&
                event["ta1ref"] === "none"
            ) {
                return null;
            }

            if (event.hasOwnProperty("relations")) {
                const relations = event["relations"].map((relation: string) => {
                    return relationMap.get(relation);
                });
                event["relations"] = relations;
            }
            if (event.hasOwnProperty("participants")) {
                event["participants"] = event["participants"].map(
                    (participant: object) => {
                        if (participant.hasOwnProperty("values")) {
                            delete participant["values"];
                        }
                        if (participant.hasOwnProperty("entity")) {
                            if(event.hasOwnProperty("entities")){
                                const entity = event["entities"].find(
                                    (entity) =>
                                        entity["@id"] === participant["entity"]
                                );
                                if (!entity) {
                                    event["entities"].push(entityMap.get(participant["entity"]));
                                }
                            } else {
                                event["entities"] = [entityMap.get(participant["entity"])];
                            }
                        }
                        return participant;
                    });

            }
            if (event.hasOwnProperty("subgroup_events")) {
                event["children"] = event["subgroup_events"].filter(
                    (child) => !SourceOnlyEvents.has(child)
                );
                delete event["subgroup_events"];
            }
            delete event["parent"];
            if (event.hasOwnProperty("isTopLevel")) {
                delete event["isTopLevel"];
            }
            if (event.hasOwnProperty("confidence")) {
                delete event["confidence"];
            }
            if (event.hasOwnProperty("predictionProvenance")) {
                delete event["predictionProvenance"];
            } else if (event.hasOwnProperty("provenance")) {
                delete event["provenance"];
                delete event["ta1ref"];
            }

            return event;
        })
        .filter((event: object) => event !== null);
    return {
        "@context": schemas["@context"],
        "@id": schemas["@id"].replace("TA2", "TA1"),
        "ceID": schemas.hasOwnProperty("ceID")? schemas["ceID"]: "newCEID",
        events: newSchema["events"],
    };
}
export {}