import React from "react";
export const Circle = () => {
    return (
        <div
            className="circle"
            style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                backgroundColor: "#000",
            }}
        ></div>
    );
};

export const Square = ({ children }) => {
    return (
        <div
            className="square"
            style={{
                width: "50px",
                height: "50px",
                backgroundColor: "#000",
            }}
        >
            {...children}
        </div>
    );
};

export const Diamond = () => {
    return (
        <div
            className="diamond"
            style={{
                position: "relative",
                width: 0,
                height: 0,
                margin: "50px auto",
                border: "50px solid transparent",
                borderBottomColor: "#000",
            }}
        >
            <div
                className="diamond__inner"
                style={{
                    position: "absolute",
                    top: "-50px",
                    left: "-50px",
                    right: "-50px",
                    bottom: "-50px",
                    backgroundColor: "#fff",
                }}
            ></div>
        </div>
    );
};
