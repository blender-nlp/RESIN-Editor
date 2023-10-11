import React, { useContext, useEffect, useRef, useState } from "react";
import { ProvenanceContext } from "../../DataReadingComponents/DataReader";
import ReactPlayer from "react-player";
import { Rnd } from "react-rnd";
import "./VideoNode.css";
import { Slider, Stack, styled } from "@mui/material";

const CustomStartEndSlider = styled(Slider)({
    color: "#3a8589",
    height: 3,
    padding: "13px 0",
    "& .MuiSlider-thumb": {
        height: 27,
        width: 27,
        backgroundColor: "#fff",
        border: "1px solid currentColor",
        "&:hover": {
            boxShadow: "0 0 0 8px rgba(58, 133, 137, 0.16)",
        },
        "& .Mui-focusVisible": {
            boxShadow: "0 0 0 8px rgba(58, 133, 137, 0.16)",
        },
        "&:active": {
            boxShadow: "0 0 0 14px rgba(58, 133, 137, 0.16)",
        },
    },
    "& .MuiSlider-track": {
        height: 3,
    },
    "& .MuiSlider-rail": {
        height: 3,
        opacity: 0.5,
        backgroundColor: "#bfbfbf",
    },
    "& .MuiSlider-mark": {
        backgroundColor: "#bfbfbf",
        height: 3,
        width: 3,
        marginTop: -3,
    },
    "& .MuiSlider-markActive": {
        opacity: 1,
        backgroundColor: "currentColor",
    },
});

function VideoWithBox({ data, containerWidth = 500 }) {
    const [provenances, setProvenances] = useContext(ProvenanceContext);
    const [url, setUrl] = useState(data.sourceURL);
    const [played, setPlayed] = useState(0);
    const [startTime, setStartTime] = useState(data.startTime);
    const [endTime, setEndTime] = useState(data.endTime);
    const [duration, setDuration] = useState(0);
    const [editing, setEditing] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [ready, setReady] = useState(false);
    const playerRef = useRef(null);

    //bounding box

    const [x, y, x_end, y_end] = data.boundingBox;
    const [scale, setScale] = useState(1);
    const [boundingBoxWidth, setBoundingBoxWidth] = useState(x_end - x);
    const [boundingBoxHeight, setBoundingBoxHeight] = useState(y_end - y);
    const [boundingBoxX, setBoundingBoxX] = useState(x);
    const [boundingBoxY, setBoundingBoxY] = useState(y);

    const [style, setStyle] = useState({
        pointerEvents: "none",
        left: `${boundingBoxX}px`,
        top: `${boundingBoxY}px`,
        width: `${boundingBoxWidth}px`,
        height: `${boundingBoxHeight}px`,
        border: "1px solid red",
        position: "absolute",
    });

    useEffect(() => {
        if (
            !playerRef.current &&
            !playerRef.current.player &&
            containerWidth === 0
        )
            return;
        console.log("containerWidth", containerWidth);
        setScale(containerWidth / 1080.0);
    }, [playerRef]);
    useEffect(() => {
        console.log("scale", scale);
        if (scale === 0) return;
        setBoundingBoxWidth((x_end - x) * scale);
        setBoundingBoxHeight((y_end - y) * scale);
        setBoundingBoxX(x * scale);
        setBoundingBoxY(y * scale);
        setStyle({
            left: `${x * scale}px`,
            top: `${y * scale}px`,
            width: `${(x_end - x) * scale}px`,
            height: `${(y_end - y) * scale}px`,
            border: "1px solid red",
            position: "absolute",
            pointerEvents: "none",
        });
    }, [scale]);

    const onProvenanceUpdate = (newProvenance) => {
        provenances.set(newProvenance.id, newProvenance);
        setProvenances(provenances);
    };

    const onReady = () => {
        setReady(true);
        playerRef.current.seekTo(startTime, "seconds");
    };
    const handleDrag = (event, { x, y }) => {
        setBoundingBoxX(x);
        setBoundingBoxY(y);
        setStyle({
            ...style,
            left: `${x}px`,
            top: `${y}px`,
        });
        data.boundingBox = [
            x / scale,
            y / scale,
            (x + boundingBoxWidth) / scale,
            (y + boundingBoxHeight) / scale,
        ];
        onProvenanceUpdate(data);
    };
    const handleResize = (event, direction, ref, delta, position) => {
        setBoundingBoxHeight(ref.offsetHeight);
        setBoundingBoxWidth(ref.offsetWidth);
        setStyle({
            ...style,
            width: `${ref.offsetWidth}px`,
            height: `${ref.offsetHeight}px`,
        });
        data.boundingBox = [
            position.x / scale,
            position.y / scale,
            (position.x + ref.offsetWidth) / scale,
            (position.y + ref.offsetHeight) / scale,
        ];
        onProvenanceUpdate(data);
    };

    useEffect(() => {
        console.log("played", played);
        if (played > endTime) {
            playerRef.current.seekTo(startTime, "seconds");
        }
    }, [played]);
    useEffect(() => {
        setStyle({
            ...style,
            pointerEvents: editing ? "auto" : "none",
        });
    }, [editing]);

    return (
        <>
            <div>
                <div
                    style={{
                        position: "relative",
                    }}
                >
                    <ReactPlayer
                        url={url}
                        ref={playerRef}
                        playing={playing}
                        controls={false}
                        light={{
                            url: url,
                            width: 1080,
                            height: 720,
                        }}
                        width={containerWidth}
                        progressInterval={1000}
                        volume={1}
                        muted={false}
                        playbackRate={1}
                        loop={false}
                        onReady={onReady}
                        onPlay={() => {
                            setPlaying(true);
                        }}
                        onPause={() => {
                            setPlaying(false);
                        }}
                        config={{
                            youtube: {
                                playerVars: { showinfo: 1 },
                            },
                        }}
                        onProgress={(state) => {
                            setPlayed(state.playedSeconds);
                        }}
                        onDuration={(duration) => {
                            setDuration(duration);
                        }}
                        onStart={() => {
                            setPlaying(true);
                        }}
                    />
                    {editing ? (
                        <Rnd
                            style={style}
                            size={{
                                width: boundingBoxWidth,
                                height: boundingBoxHeight,
                            }}
                            position={{ x: boundingBoxX, y: boundingBoxY }}
                            onDragStop={(e, d) => {
                                handleDrag(e, d);
                            }}
                            onResizeStop={(
                                e,
                                direction,
                                ref,
                                delta,
                                position
                            ) => {
                                handleResize(
                                    e,
                                    direction,
                                    ref,
                                    delta,
                                    position
                                );
                            }}
                        >
                            <div className="box" />
                        </Rnd>
                    ) : (
                        <div className="box" style={style}></div>
                    )}
                </div>

                <>
                    {ready && (
                        <>
                            <div
                                className="control-bar"
                                style={{
                                    width: containerWidth,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "10px",
                                    padding: "10px",
                                }}
                            >
                                <Stack
                                    style={{
                                        width: "100%",
                                    }}
                                    spacing={2}
                                    direction="row"
                                    sx={{ mb: 1 }}
                                    alignItems="center"
                                >
                                    <text>
                                        {Math.floor(startTime / 60)}:
                                        {Math.floor(startTime % 60)
                                            .toString()
                                            .padStart(2, "0")}
                                    </text>
                                    {editing ? (
                                        <CustomStartEndSlider
                                            value={[startTime, endTime]}
                                            aria-label="Custom marks"
                                            min={0}
                                            max={duration}
                                            // valueLabelDisplay="on"
                                            onChange={(e, value) => {
                                                setStartTime(value[0]);
                                                setEndTime(value[1]);

                                                if (playerRef.current) {
                                                    playerRef.current.seekTo(
                                                        value[0],
                                                        "seconds"
                                                    );
                                                }
                                                data.startTime = value[0];
                                                data.endTime = value[1];
                                                onProvenanceUpdate(data);
                                            }}
                                        />
                                    ) : (
                                        <Slider
                                            value={played}
                                            aria-label="Custom marks"
                                            min={0}
                                            max={duration}
                                            // valueLabelDisplay="on"
                                            marks={[
                                                {
                                                    value: startTime,
                                                    label: `${Math.floor(
                                                        startTime / 60
                                                    )}:${Math.floor(
                                                        startTime % 60
                                                    )
                                                        .toString()
                                                        .padStart(2, "0")}`,
                                                    className: "special",
                                                },
                                                {
                                                    value: endTime,
                                                    label: `${Math.floor(
                                                        endTime / 60
                                                    )}:${Math.floor(
                                                        endTime % 60
                                                    )
                                                        .toString()
                                                        .padStart(2, "0")}`,
                                                },
                                            ]}
                                            onChange={(e, value) => {
                                                if (playerRef.current) {
                                                    playerRef.current.seekTo(
                                                        value,
                                                        "seconds"
                                                    );
                                                }
                                            }}
                                        />
                                    )}
                                    <text>
                                        {Math.floor(duration / 60)}:
                                        {Math.floor(duration % 60)
                                            .toString()
                                            .padStart(2, "0")}
                                    </text>
                                </Stack>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    width: "100%",
                                    flexDirection: "row",
                                }}
                            >
                                <button
                                    onClick={() => {
                                        if (playerRef.current) {
                                            playerRef.current.seekTo(
                                                played - 5 > startTime
                                                    ? played - 5
                                                    : 0,
                                                "seconds"
                                            );
                                        }
                                    }}
                                    style={{
                                        marginRight: "5px",
                                        backgroundColor: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        outline: "none",
                                        color: "black",
                                    }}
                                >
                                    <i className="fa fa-backward"></i>
                                </button>

                                <button
                                    onClick={() => {
                                        setPlaying(!playing);
                                        if (playerRef.current) {
                                            playerRef.current.seekTo(
                                                startTime,
                                                "seconds"
                                            );
                                        }
                                    }}
                                    style={{
                                        marginRight: "5px",
                                        backgroundColor: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        outline: "none",
                                        color: "black",
                                    }}
                                >
                                    {playing ? (
                                        <i className="fa fa-pause"></i>
                                    ) : (
                                        <i className="fa fa-play"></i>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        if (playerRef.current) {
                                            playerRef.current.seekTo(
                                                played + 5 > endTime
                                                    ? endTime
                                                    : played + 5,
                                                "seconds"
                                            );
                                        }
                                    }}
                                    style={{
                                        marginRight: "5px",
                                        backgroundColor: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        outline: "none",
                                        color: "black",
                                    }}
                                >
                                    <i className="fa fa-forward"></i>
                                </button>
                            </div>
                        </>
                    )}

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
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
                        {data.sourceURL &&
                            data.sourceURL[0] !== "undefined" && (
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
                </>
            </div>
        </>
    );
}

function VideoNode({ data }) {
    const divRef = useRef(null);

    return (
        <div
            className="provenance-node"
            ref={divRef}
            style={{
                padding: 10,
                background: "white",
                width: "600px",
                borderRadius: "10px",
                boxShadow: "0 0 10px rgba(0,0,0,0.2)",
            }}
        >
            <VideoWithBox data={data} />
        </div>
    );
}
export default VideoNode;
