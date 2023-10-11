import { useContext } from "react";
import {
    DataContext,
    EntitiesContext,
    ProvenanceContext,
} from "../DataReadingComponents/DataReader";
import { JsonConvert } from "json2typescript";
import { TA2traverseAllEvents } from "../DataReadingComponents/MergeMultipleFiles";
import useStore from "./store";
import { EventNode, Entity } from "./Library";

export const TA2DownloadSubgraph = ({ nodeId, onClick }) => {
    const [Provenances] = useContext(ProvenanceContext);
    const [Entities] = useContext(EntitiesContext);
    const [jsonData] = useContext(DataContext);
    const [mapNodes] = useStore((state) => [state.mapNodes]);

    const downloadSubgraph = (nodeId) => {
        const TA2traverseAllEventsData = TA2traverseAllEvents(mapNodes, nodeId);
        const jsonConverter = new JsonConvert();
        const allEvents = jsonConverter.serializeArray(
            Array.from(mapNodes.values())
                .filter((event) =>
                    TA2traverseAllEventsData.eventsSet.has(event.id)
                )
                .map((event) => {
                    if (event.id === nodeId) {
                        event.isTopLevel = true;
                        event.parent = "kairos:NULL";
                    }
                    return event;
                }),
            EventNode
        );
        const newData = {
            ceID: jsonData.ceID,
            "@context": jsonData["@context"],
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
        downloadAnchorNode.setAttribute("download", "subgraph.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <button
            onClick={() => {
                if (onClick instanceof Function) {
                    onClick();
                }
                downloadSubgraph(nodeId);
            }}
            className="selection-button"
        >
            <i className="fa fa-download"></i>
        </button>
    );
};

export default TA2DownloadSubgraph;
