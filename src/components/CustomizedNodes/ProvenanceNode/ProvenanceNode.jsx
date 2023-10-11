// ProvenanceNode.jsx
import React, { memo, useContext } from "react";
import {
    ExtractedFilesContext,
    ExtractedTextsContext,
} from "../../DataReadingComponents/DataReader";
import ImageNode from "../ImageNode/ImageNode";
import EditableTextNode from "../TextNode/TextNode";
import VideoNode from "../VideoNode/VideoNode";

const ProvenanceNode = ({ data }) => {
    const [extractedFiles, _] = useContext(ExtractedFilesContext);

    const [extractedTexts, setExtractedTexts] = useContext(
        ExtractedTextsContext
    );

    if (!data) return <></>;
    console.log("extractedFiles: ", extractedFiles);

    if (data.mediaType.startsWith("video/")) {
        return (
            <VideoNode data={data} />
        );
    }

    if (extractedFiles.size > 0) {
        const fileContent = extractedFiles.get(data.childID);
        // console.log("fileContent: ", fileContent);
        if (fileContent) {
            if (data.mediaType.startsWith("image/")) {
                return <ImageNode data={data} fileContent={fileContent} />;
            }
        }
    }

    if (extractedTexts.size > 0) {
        const textContent = extractedTexts.get(data.childID);
        // console.log("textContent: ", textContent);
        if (textContent) {
            if (data.mediaType.startsWith("text/")) {
                return (
                    <EditableTextNode data={data} fileContent={textContent} />
                );
            }
        }
    }

    return (
        <div className="provenance-node">
            <div className="provenance-node-content">
                <h3>{data.childID}</h3>
                <p>{data.parentID}</p>
                <p>{data.mediaType}</p>
            </div>
        </div>
    );
};

export default memo(ProvenanceNode);
