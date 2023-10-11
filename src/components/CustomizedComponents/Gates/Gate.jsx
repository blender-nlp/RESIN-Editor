import React from "react";
import { AndGate, OrGate, XorGate } from "./Gates.jsx";

function Gate({ data, isConnectable = true, label }) {
    return (
        <div
            style={{
                background: "",
            }}
        >
            <h2
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2rem",
                    width: "100%",
                }}
            >
                {data.name}
            </h2>
            <div
                style={{
                    justifyContent: "center",
                    alignItems: "center",
                    position: "absolute",
                    left: "calc(50% - 60px)",
                    top: "-115px",
                    background: "transparent",
                }}
            >
                {data.gate === "xor" ? (
                    <XorGate color={data.color} strokeColor="black" />
                ) : data.gate === "and" ? (
                    <AndGate color={data.color} strokeColor="black" />
                ) : (
                    <OrGate color={data.color} strokeColor="black" />
                )}
            </div>
        </div>
    );
}

export default Gate;
