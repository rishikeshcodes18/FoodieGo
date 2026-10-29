import React, { useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// The 14 food options matching Screenshot 2
const CUISINE_ITEMS = [
  { id: 'biryani', name: 'Biryani', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&q=80' },
  { id: 'south-indian', name: 'South Indian', img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=200&q=80' },
  { id: 'north-indian', name: 'North Indian', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&q=80' },
  { id: 'desserts', name: 'Desserts', img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=200&q=80' },
  { id: 'cake', name: 'Cake', img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80' },
  { id: 'chinese', name: 'Chinese', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200&q=80' },
  { id: 'pizza', name: 'Pizza', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=80' },
  { id: 'rolls', name: 'Rolls', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&q=80' },
  { id: 'ice-cream', name: 'Ice Cream', img: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=200&q=80' },
  { id: 'parotta', name: 'Parotta', img: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&q=80' },
  { id: 'noodles', name: 'Noodles', img: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=200&q=80' },
  { id: 'dosa', name: 'Dosa', img: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=200&q=80' },
  { id: 'salad', name: 'Salad', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=80' },
  { id: 'pasta', name: 'Pasta', img: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281728?w=200&q=80' }
];

export default function CuisineCarousel({ selectedCuisine, onSelectCuisine }) {
  const trackRef = useRef(null);

  const scroll = (direction) => {
    if (trackRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="cuisine-section">
      <div className="cuisine-header-row">
        <div>
          <h2 className="cuisine-heading">Order our best food options</h2>
          <p className="cuisine-subheading">Whatever you're craving, there's something ready for you.</p>
        </div>

        <div className="carousel-nav-arrows">
          <button
            className="nav-arrow-circle"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            title="Scroll left"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className="nav-arrow-circle"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            title="Scroll right"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div className="cuisine-track-container" ref={trackRef}>
        <div className="cuisine-track">
          {CUISINE_ITEMS.map((item) => {
            const isSelected = selectedCuisine?.toLowerCase() === item.name.toLowerCase();
            return (
              <div
                key={item.id}
                className={`cuisine-item ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectCuisine(isSelected ? null : item.name)}
                title={`Filter by ${item.name}`}
              >
                <div className="cuisine-img-wrapper">
                  <img src={item.img} alt={item.name} className="cuisine-img" />
                </div>
                <span className="cuisine-label">{item.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
