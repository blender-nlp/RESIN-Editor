import React, { useContext, useEffect, useRef, useState } from "react";
import { ProvenanceContext } from "../../DataReadingComponents/DataReader";
import "./TextNode.css";

const EditableTextNode = ({ data, fileContent }) => {
    const [nodeData, setNodeData] = useState(data);
    const [editing, setEditing] = useState(false);
    const textRef = useRef();
    const [provenances, setProvenances] = useContext(ProvenanceContext);
    const [showWholeParagraph, setShowWholeParagraph] = useState(false);
    const [start, setStart] = useState(0);
    const [end, setEnd] = useState(0);
    const [beginHighlight, setBeginHighlight] = useState(0);
    const [endHighlight, setEndHighlight] = useState(0);
    const onProvenanceUpdate = (newProvenance) => {
        console.log("data: ", newProvenance);
        provenances.set(newProvenance.id, newProvenance);
        setProvenances(provenances);
        setNodeData(newProvenance);
        console.log("newprovenances: ", provenances.get(newProvenance.id));
    };

    const handleMouseUp = () => {
        if (editing) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                console.log("selection: ", selection);
                const range = selection.getRangeAt(0);
                const { startOffset, endOffset } = range;
                console.log("start", start);
                console.log("startOffset: ", startOffset);
                console.log("endOffset: ", endOffset);
                const newOffset = startOffset + start;
                const newLength = endOffset - startOffset;
                data.offset = newOffset;
                data.length = newLength;
                onProvenanceUpdate(data);
            }
        }
    };

    const extractSentence = (text, offset, length, showWholePara = false) => {
        let start = offset;
        if (showWholePara) {
            while (start > 0 && !text[start - 1].match(/[\r\n]/)) {
                start -= 1;
            }
            while (start < text.length && text[start].match(/\s/)) {
                start += 1;
            }

            let end = offset + length;
            while (end < text.length && !text[end].match(/[\r\n]/)) {
                end += 1;
            }
            return [start, offset, offset + length, end];
        } else {
            while (start > 0 && !text[start - 1].match(/[.!?]/)) {
                start -= 1;
            }
            while (start < text.length && text[start].match(/\s/)) {
                start += 1;
            }

            let end = offset + length;
            while (end < text.length && !text[end].match(/[.!?]/)) {
                end += 1;
            }
            return [start, offset, offset + length, end];
        }
    };

    const sentence = fileContent.slice(start, end);
    const highlightedSentence = (
        <p
            ref={textRef}
            onMouseUp={handleMouseUp}
            style={{ userSelect: editing ? "text" : "none" }}
        >
            {sentence.slice(0, beginHighlight - start)}
            <mark>
                {sentence.slice(beginHighlight - start, endHighlight - start)}
            </mark>
            {sentence.slice(endHighlight - start)}
        </p>
    );
    const wholeSentence = (
        <p
            ref={textRef}
            onMouseUp={handleMouseUp}
            style={{ userSelect: editing ? "text" : "none" }}
        >
            {sentence}
        </p>
    );

    useEffect(() => {
        const [nstart, nbeginHighlight, nendHighlight, nend] = extractSentence(
            fileContent,
            nodeData.offset,
            nodeData.length,
            showWholeParagraph
        );
        setStart(nstart);
        setBeginHighlight(nbeginHighlight);
        setEndHighlight(nendHighlight);
        setEnd(nend);
    }, [editing, showWholeParagraph]);
    console.log("data sourceURL: ", data.sourceURL);

    return (
        <div className="text-node">
            {editing ? wholeSentence : highlightedSentence}
            <div>
                <button
                    onClick={() => setEditing(!editing)}
                    style={{
                        marginRight: "5px",
                        backgroundColor: "transparent",
                        border: "none",
                        cursor: "pointer",
                        outline: "none",
                        fontSize: "16px",
                        color: editing ? "green" : "blue",
                    }}
                >
                    {editing ? (
                        <i className="fa fa-check" />
                    ) : (
                        <i className="fa fa-pencil" />
                    )}
                </button>
                <button
                    onClick={() => setShowWholeParagraph(!showWholeParagraph)}
                    style={{
                        marginRight: "5px",
                        backgroundColor: "transparent",
                        border: "none",
                        cursor: "pointer",
                        outline: "none",
                        fontSize: "16px",
                        color: showWholeParagraph ? "green" : "blue",
                    }}
                >
                    {<i className="fa fa-paragraph" />}
                </button>
                {data.sourceURL && data.sourceURL[0] !== "undefined" && (
                    <button
                        style={{
                            backgroundColor: "transparent",
                            border: "none",
                            cursor: "pointer",
                            outline: "none",
                            fontSize: "16px",
                            color: "blue",
                        }}
                    >
                        <a
                            href={data.sourceURL[0]}
                            rel="noreferrer"
                            target="_blank"
                        >
                            <i className="fa fa-link" />
                        </a>
                    </button>
                )}
            </div>
        </div>
    );
};

export default EditableTextNode;
