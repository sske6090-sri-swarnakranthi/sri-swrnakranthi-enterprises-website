import { useEffect, useState } from 'react';

const useFooterVisibility = () => {
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    const footer = document.querySelector('.footer'); // Assuming your footer has the class "footer"
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting); // If footer is in view, set true
      },
      { threshold: 1.0 } // Trigger when the footer is fully in view
    );

    if (footer) {
      observer.observe(footer); // Observe the footer element
    }

    return () => {
      if (footer) {
        observer.unobserve(footer); // Clean up observer when component unmounts
      }
    };
  }, []);

  return isFooterVisible;
};

export default useFooterVisibility;
