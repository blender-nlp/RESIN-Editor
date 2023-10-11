const getId = (prefix, suffix, mapEvents, currentId) => {
    let newId = currentId;
    while (mapEvents.has(newId)) {
        const newNum = Math.floor(Math.random() * 10000).toString();
        newId = prefix + newNum.padStart(5, "0") + suffix;
    }
    return newId;
};

export const TA2dataMergeMultipleFiles = (dataList) => {
    console.log("dataList", dataList);
    const mapEvents = new Map();
    const mapEntities = new Map();
    const mapRelations = new Map();
    const mapParticipants = new Map();
    const mapValues = new Map();
    const mapProvenance = new Map();
    const isTopLevelEvents = new Map();
    const mergedCEs = [];
    const eventPrefix = "resin:Events/";
    const entityPrefix = "resin:Entities/";
    const relationPrefix = "resin:Relations/";
    const participantPrefix = "resin:Participants/";
    const valuePrefix = "resin:Values/";
    const provenancePrefix = "resin:Provenance/";
    const mergedEventId = getId(
        eventPrefix,
        "/",
        mapEvents,
        "resin:Events/00000/"
    );
    const originalEvent = {
        "@id": mergedEventId,
        name: "Merge Matching Results",
        description: `This is a merged event of multiple matching results of ${dataList
            .map((dataObject) => dataObject.ceID)
            .join(", ")}`,
        isTopLevel: true,
        parent: "kairos:NULL",
        children_gate: "or",
        subgroup_events: [],
        ta1ref: "none",
        confidence: 0,
        predictionProvenance: mergedEventId,
    };
    mapEvents.set(originalEvent["@id"], {
        "@id": originalEvent["@id"],
        ceID: "null",
    });

    dataList.forEach((dataObject) => {
        let ceID = dataObject.ceID;
        let num = 1;
        while (mergedCEs.includes(ceID)) {
            ceID = `${ceID} (${num})`;
        }

        mergedCEs.push(ceID);

        // Replace the old provenance
        const provenanceData = dataObject.provenanceData;
        const mapProvenanceReverse = new Map();

        provenanceData.forEach((provenance) => {
            const newId = getId(
                provenancePrefix,
                "/",
                mapProvenance,
                provenance["provenanceID"]
            );
            mapProvenance.set(newId, {
                provenanceID: provenance["provenanceID"],
                ceID: ceID,
            });
            mapProvenanceReverse.set(provenance["provenanceID"], newId);
            provenance["provenanceID"] = newId;
        });
        dataObject.provenanceData = provenanceData;

        // Add the new ids to the maps
        const data = dataObject.instances[0];
        console.log("data over here", data);
        const mapEventsReverse = new Map();
        const mapEntitiesReverse = new Map();
        const mapRelationsReverse = new Map();
        const mapParticipantsReverse = new Map();
        const mapValuesReverse = new Map();

        data.events.forEach((event) => {
            const newId = getId(eventPrefix, "/", mapEvents, event["@id"]);
            mapEvents.set(newId, {
                "@id": event["@id"],
                ceID: ceID,
            });
            mapEventsReverse.set(event["@id"], newId);
            event.participants?.forEach((participant) => {
                const newId = getId(
                    participantPrefix,
                    "/",
                    mapParticipants,
                    participant["@id"]
                );
                mapParticipants.set(newId, {
                    "@id": participant["@id"],
                    ceID: ceID,
                });
                mapParticipantsReverse.set(participant["@id"], newId);
                participant.values?.forEach((value) => {
                    const newId = getId(
                        valuePrefix,
                        "/",
                        mapValues,
                        value["@id"]
                    );
                    mapValues.set(newId, {
                        "@id": value["@id"],
                        ceID: ceID,
                    });
                    mapValuesReverse.set(value["@id"], newId);
                });
            });
        });
        data.entities.forEach((entity) => {
            const newId = getId(entityPrefix, "/", mapEntities, entity["@id"]);
            mapEntities.set(newId, {
                "@id": entity["@id"],
                ceID: ceID,
            });
            mapEntitiesReverse.set(entity["@id"], newId);
        });
        data.relations.forEach((relation) => {
            const newId = getId(
                relationPrefix,
                "/",
                mapRelations,
                relation["@id"]
            );
            mapRelations.set(newId, {
                "@id": relation["@id"],
                ceID: ceID,
            });
            mapRelationsReverse.set(relation["@id"], newId);
        });

        // Replace the old ids with the new ones
        data.events.forEach((event) => {
            event["@id"] = mapEventsReverse.get(event["@id"]);

            // replace top level events
            if (event.isTopLevel) {
                isTopLevelEvents.set(ceID, {
                    "@id": event["@id"],
                    ceID: ceID,
                });
                event.isTopLevel = false;
                event.parent = originalEvent["@id"];
                event.name = `${event.name} (${ceID})`;
                originalEvent.subgroup_events.push(event["@id"]);
            } else if (event.parent) {
                event.parent = mapEventsReverse.get(event.parent);
            }

            // Replace the old ids of SUBGROUP_EVENTS and OUTLINKS with the new ones
            if (event.subgroup_events) {
                event.subgroup_events = event.subgroup_events.map((subgroup) =>
                    mapEventsReverse.get(subgroup)
                );
            }
            if (event.outlinks) {
                event.outlinks = event.outlinks.map((outlink) =>
                    mapEventsReverse.get(outlink)
                );
            }

            // replace Provenance old ids with the new ones
            if (event.provenance) {
                if (event.provenance instanceof Array) {
                    event.provenance = event.provenance.map((provenance) =>
                        mapProvenanceReverse.get(provenance)
                    );
                } else {
                    event.provenance = mapProvenanceReverse.get(
                        event.provenance
                    );
                }
            }

            // Replace the old ids of participants with the new ones
            event.participants?.forEach((participant) => {
                participant["@id"] = mapParticipantsReverse.get(
                    participant["@id"]
                );
                if (participant.entity) {
                    participant.entity = mapEntitiesReverse.get(
                        participant.entity
                    );
                }

                participant.values?.forEach((value) => {
                    value["@id"] = mapValuesReverse.get(value["@id"]);
                    if (value.provenance) {
                        if (value.provenance instanceof Array) {
                            value.provenance = value.provenance.map(
                                (provenance) =>
                                    mapProvenanceReverse.get(provenance)
                            );
                        } else {
                            value.provenance = mapProvenanceReverse.get(
                                value.provenance
                            );
                        }
                    }
                    if (value.ta2entity) {
                        if (value.ta2entity instanceof Array) {
                            value.ta2entity = value.ta2entity.map((entity) =>
                                mapEntitiesReverse.get(entity)
                            );
                        } else {
                            value.ta2entity = mapEntitiesReverse.get(
                                value.ta2entity
                            );
                        }
                    }
                });
            });

            //replace the old ids of relations with the new ones
            event.relations?.forEach((relation) => {
                relation["@id"] = mapRelationsReverse.get(relation["@id"]);
                relation.relationObject = mapEntitiesReverse.get(
                    relation.relationObject
                );
                relation.relationSubject = mapEntitiesReverse.get(
                    relation.relationSubject
                );
            });
        });

        // Replace the old ids of entities and relations with the new ones
        data.entities.forEach((entity) => {
            entity["@id"] = mapEntitiesReverse.get(entity["@id"]);
        });
        data.relations.forEach((relation) => {
            relation["@id"] = mapRelationsReverse.get(relation["@id"]);
            relation.relationObject = mapEntitiesReverse.get(
                relation.relationObject
            );
            relation.relationSubject = mapEntitiesReverse.get(
                relation.relationSubject
            );
        });

        dataObject.instances[0] = data;
    });

    console.log("mapEvents", mapEvents);
    console.log("mapEntities", mapEntities);
    console.log("mapRelations", mapRelations);
    console.log("mapParticipants", mapParticipants);
    console.log("mapValues", mapValues);
    console.log("mapProvenance", mapProvenance);

    return {
        "@context": dataList.map((dataObject) => dataObject["@context"]).flat(),
        ceID: dataList.map((dataObject) => dataObject.ceID).join("+"),
        "@id": "resin:Submissions/TA2/00000/",
        mergedCEs: mergedCEs,
        mapEvents: mapEvents,
        mapEntities: mapEntities,
        mapRelations: mapRelations,
        mapParticipants: mapParticipants,
        mapValues: mapValues,
        mapProvenance: mapProvenance,
        isTopLevelEvents: isTopLevelEvents,
        instances: [
            {
                "@id": "resin:Instances/00000/",
                events: [
                    originalEvent,
                    ...dataList
                        .map((dataObject) => dataObject.instances[0].events)
                        .flat(),
                ],
                entities: [
                    ...dataList
                        .map((dataObject) => dataObject.instances[0].entities)
                        .flat(),
                ],
                relations: [
                    ...dataList
                        .map((dataObject) => dataObject.instances[0].relations)
                        .flat(),
                ],
            },
        ],
        provenanceData: [
            ...dataList.map((dataObject) => dataObject.provenanceData).flat(),
        ],
    };
};

export const TA2traverseAllEvents = (mapEvents, topLevelEvent) => {
    const eventsSet = new Set();
    const entitiesSet = new Set();
    const provenanceSet = new Set();
    const participantsSet = new Set();

    const traverseEvent = (event) => {
        eventsSet.add(event.id);
        if (event.provenance) {
            if (event.provenance instanceof Array) {
                event.provenance.forEach((provenance) => {
                    provenanceSet.add(provenance);
                });
            } else {
                provenanceSet.add(event.provenance);
            }
        }
        event.participants?.forEach((participant) => {
            participantsSet.add(participant);
            entitiesSet.add(participant.entity);
            participant.values?.forEach((value) => {
                entitiesSet.add(value.id);
                console.log("processing value", value);
                if (value.provenance) {
                    if (value.provenance instanceof Array) {
                        value.provenance.forEach((provenance) => {
                            provenanceSet.add(provenance);
                        });
                    } else {
                        provenanceSet.add(value.provenance);
                    }
                }
                if (value.entity) {
                    entitiesSet.add(value.entity);
                }
                if (value.ta2entity) {
                    if (value.ta2entity instanceof Array) {
                        value.ta2entity.forEach((entity) => {
                            console.log("add ta2entities", entity);
                            entitiesSet.add(entity);
                        });
                    } else {
                        entitiesSet.add(value.ta2entity);
                    }
                }
            });
        });
        event.subgroupEvents?.forEach((subgroup) => {
            traverseEvent(mapEvents.get(subgroup));
        });
    };
    console.log("topLevelEvent", topLevelEvent);
    console.log("mapEvents.get(topLevelEvent)", mapEvents.get(topLevelEvent));
    traverseEvent(mapEvents.get(topLevelEvent));
    return {
        eventsSet: eventsSet,
        entitiesSet: entitiesSet,
        provenanceSet: provenanceSet,
    };
};
