import React from 'react';

interface Props {
  src: string;
  alt: string;
}

const StaticImagePage: React.FC<Props> = ({ src, alt }) => {
  return (
    <div className="w-full h-screen bg-white flex items-center justify-center">
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
};

export default StaticImagePage;


