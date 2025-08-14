import * as React from "react";
import Svg, { Path } from "react-native-svg";
const ArrowRight = (props) => (
    <Svg
        width={70}
        height={70}
        viewBox="0 0 70 70"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <Path
            d="M42.088 17.296 59.792 35 42.087 52.704M10.208 35h49.088"
            stroke="#fff"
            strokeWidth={4}
            strokeMiterlimit={10}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);
export default ArrowRight;
