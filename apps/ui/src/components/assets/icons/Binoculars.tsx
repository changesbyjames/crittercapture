import { FC, SVGAttributes } from 'react';

export const Binoculars: FC<SVGAttributes<SVGSVGElement>> = ({ ...props }) => {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" {...props}>
      <circle cx="4" cy="10.5" r="2.5" fill="#F5EFD7" />
      <circle cx="13" cy="10.5" r="2.5" fill="#F5EFD7" />
      <path
        d="M15.5129 9.2281L12.7487 4.86395H12.7481C12.4181 4.34381 11.853 4 11.2107 4C10.1935 4 9.3689 4.86078 9.3689 5.92331C9.3689 6.02163 9.3762 6.11868 9.38956 6.2132L9.39017 6.21638L9.40354 6.30835H8.5978L8.61117 6.21638L8.61178 6.2132C8.62575 6.11869 8.63243 6.02164 8.63243 5.92331C8.63243 4.86145 7.80785 4 6.79063 4C6.14835 4 5.58263 4.34317 5.25329 4.86395H5.25268L2.48733 9.2281H2.48794C2.17986 9.71462 2 10.2969 2 10.9236C2 12.623 3.31981 14 4.94704 14C6.42362 14 7.64674 12.8665 7.86126 11.3865L7.9919 10.4833C8.24953 10.7548 8.60562 10.9228 8.99999 10.9228C9.39374 10.9228 9.75043 10.7541 10.0075 10.4833L10.1381 11.3865C10.3526 12.8658 11.5752 14 13.0523 14C14.6802 14 16 12.6229 16 10.9236C16 10.2975 15.8201 9.71519 15.5121 9.22858L15.5129 9.2281ZM4.94713 12.923C3.89104 12.923 3.03128 12.0261 3.03128 10.9231C3.03128 9.82063 3.8911 8.92313 4.94713 8.92313C6.00323 8.92313 6.86298 9.82006 6.86298 10.9231C6.86359 12.0262 6.00377 12.923 4.94713 12.923ZM9.00019 10.1542C8.62344 10.1542 8.3178 9.83513 8.3178 9.44185C8.3178 9.04856 8.62344 8.7295 9.00019 8.7295C9.37693 8.7295 9.68257 9.04856 9.68257 9.44185C9.68257 9.83513 9.37693 10.1542 9.00019 10.1542ZM13.0532 12.923C11.9971 12.923 11.1374 12.0261 11.1374 10.9231C11.1374 9.82063 11.9966 8.92313 13.0532 8.92313C14.1093 8.92313 14.9691 9.82006 14.9691 10.9231C14.9685 12.0262 14.1093 12.923 13.0532 12.923Z"
        fill="currentColor"
      />
    </svg>
  );
};