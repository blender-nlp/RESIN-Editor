import React from "react";
import { Handle } from "reactflow";

const XorGate = ({
    color = "#000000",
    strokeColor = "#fff",
    isConnectable = true,
    wordColor = "#fff",
    ...otherProps
}) => {
    return (
        <>
            <Handle
                type="target"
                position="top"
                style={{
                    background: "#555",
                    borderRadius: "50%",
                    top: "55px",
                }}
                onConnect={(params) => console.log("handle onConnect", params)}
                isConnectable={false}
            />
            <strong
                style={{
                    position: "absolute",
                    top: "70px",
                    left: "63px",
                    color: wordColor,
                }}
            >
                xor
            </strong>
            <svg
                id="ehoE6OIib8w1"
                height="150px"
                width="150px"
                viewBox="0 0 300 300"
                shapeRendering="geometricPrecision"
                textRendering="geometricPrecision"
            >
                <path
                    d="M91.193853,100.472813c29.318157,20.608242,88.171413,24.067787,118.289706,0c4.952073,50.757338-26.486495,105.690566-59.188051,114.346057-33.906659-5.067451-68.518956-54.72991-59.101655-114.346057Z"
                    transform="translate(0 12.411347)"
                    fill={color}
                    stroke={strokeColor}
                    strokeWidth="7"
                />
                <path
                    d="M91.193853,100.472813c29.318157,20.608242,88.085017,24.067787,118.20331,0"
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="7"
                />
            </svg>
        </>
    );
};
const OrGate = ({
    color = "#000000",
    strokeColor = "#fff",
    isConnectable = true,
    wordColor = "#fff",
    ...otherProps
}) => {
    return (
        <>
            <Handle
                type="target"
                position="top"
                style={{
                    background: "#555",
                    borderRadius: "50%",
                    top: "60px",
                    left: "75px",
                }}
                onConnect={(params) => console.log("handle onConnect", params)}
                isConnectable={false}
            />
            <strong
                style={{
                    position: "absolute",
                    top: "70px",
                    left: "45%",
                    color: wordColor,
                }}
            >
                or
            </strong>
            <svg
                id="ehoE6OIib8w1"
                height="150px"
                width="150px"
                viewBox="0 0 300 300"
                shapeRendering="geometricPrecision"
                textRendering="geometricPrecision"
            >
                <path
                    d="M91.193853,100.472813c29.318157,20.608242,88.171413,24.067787,118.289706,0c4.952073,50.757338-26.486495,105.690566-59.188051,114.346057-33.906659-5.067451-68.518956-54.72991-59.101655-114.346057Z"
                    transform="translate(0 12.411347)"
                    fill={color}
                    stroke={strokeColor}
                    strokeWidth="7"
                />
            </svg>
        </>
    );
};

const AndGate = ({
    color = "#000000",
    strokeColor = "#fff",
    isConnectable = true,
    wordColor = "#fff",
    ...otherProps
}) => {
    return (
        <>
            <Handle
                type="target"
                position="top"
                style={{
                    background: "#555",
                    borderRadius: "50%",
                    top: "55px",
                    left: "75px",
                }}
                onConnect={(params) => console.log("handle onConnect", params)}
                isConnectable={false}
            />
            <strong
                style={{
                    position: "absolute",
                    top: "70px",
                    left: "60px",
                    color: wordColor,
                }}
            >
                and
            </strong>
            <svg
                id="eOWYq7riXFB1"
                height="150px"
                width="150px"
                viewBox="0 0 300 300"
                shapeRendering="geometricPrecision"
                textRendering="geometricPrecision"
            >
                <path
                    d="M91.193853,100.472813c38.792658-1.928217,96.656399.183657,118.289706,0c4.952073,50.757338-26.486495,105.690566-59.188051,114.346057-33.906659-5.067451-68.518956-54.72991-59.101655-114.346057Z"
                    transform="translate(.000017 16.777446)"
                    fill={color}
                    stroke={strokeColor}
                    strokeWidth="7"
                />
            </svg>
        </>
    );
};
export { XorGate, OrGate, AndGate };
