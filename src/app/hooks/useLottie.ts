import { useState, useEffect } from 'react';

export function useLottie(url: string) {
  const [animationData, setAnimationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        setAnimationData(data);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
      });
  }, [url]);

  return { animationData, loading };
}
