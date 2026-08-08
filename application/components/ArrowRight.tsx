import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

type Props = {
  height?: number;
  width?: number;
  color?: string;
};

const ArrowRight = ({ height = 70, width, color = '#fff', ...props }: Props) => (
  <Svg
    width={width ?? height}
    height={height}
    viewBox="0 0 70 70"
    fill="none"
    {...props}
  >
    <Path
      d="M42.088 17.296 59.792 35 42.087 52.704M10.208 35h49.088"
      stroke={color}
      strokeWidth={4}
      strokeMiterlimit={10}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default ArrowRight;
