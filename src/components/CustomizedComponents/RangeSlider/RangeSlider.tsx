import { Slider } from "@mui/material";
import React, { useState } from "react";
import "./RangeSlider.css";

interface RangeSliderProps {
    onValueChange: (newValue: [number, number]) => void;
    initialValue?: [number, number];
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
    onValueChange,
    initialValue,
}) => {
    const [value, setValue] = useState<[number, number]>(
        initialValue ? initialValue : [0, 1]
    );

    const handleSliderChange = (event: any, newValue: number | number[]) => {
        let updatedValues = newValue as [number, number];
        setValue(updatedValues);
        console.log(updatedValues);
        // onValueChange(updatedValues);
    };

    const handleInputChange = (
        event: React.ChangeEvent<HTMLInputElement>,
        index: number
    ) => {
        const newValue = parseFloat(event.target.value);
        let updatedValues: [number, number] = [...value];
        updatedValues[index] = newValue;
        setValue(updatedValues);
        // onValueChange(updatedValues);
    };
    const handleChangeCommitted = (event: any, newValue: number | number[]) => {
        let updatedValues = newValue as [number, number];
        setValue(updatedValues);
        console.log(updatedValues);
        onValueChange(updatedValues);
    };

    return (
        <div className="slider-container">
            <p className="slider-label">Confidence</p>
            <Slider
                getAriaLabel={() => "Temperature range"}
                value={value}
                step={0.01}
                style={{ margin: "0 20 0 20", color: "black" }}
                onChange={handleSliderChange}
                valueLabelDisplay="auto"
                disableSwap
                min={0}
                max={1}
                onChangeCommitted={handleChangeCommitted}
            />
            <div className="input-container">
                <input
                    className="number-input"
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={value[0]}
                    onChange={(event) => handleInputChange(event, 0)}
                />

                <input
                    className="number-input"
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={value[1]}
                    onChange={(event) => handleInputChange(event, 1)}
                />
            </div>
        </div>
    );
};

export default RangeSlider;
