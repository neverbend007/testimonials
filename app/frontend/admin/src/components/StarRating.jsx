import React from 'react';

const StarRating = ({ rating, maxRating = 5 }) => {
  return (
    <div className="star-rating">
      {[...Array(maxRating)].map((_, index) => (
        <span
          key={index}
          className={`star ${index < rating ? '' : 'empty'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default StarRating;