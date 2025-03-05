import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './Hero.css';

const Hero = () => {
  // Sample hero slides data - replace with your actual data
  const heroSlides = [
    {
      id: 1,
      title: "New Summer Collection",
      subtitle: "Discover the hottest trends for this season",
      buttonText: "Shop Now",
      imageUrl: "/images/hero-slide-1.jpg",
      link: "/summer-collection"
    },
    {
      id: 2,
      title: "Special Offers",
      subtitle: "Up to 50% off on selected items",
      buttonText: "View Deals",
      imageUrl: "/images/hero-slide-2.jpg",
      link: "/special-offers"
    },
    {
      id: 3,
      title: "New Arrivals",
      subtitle: "Be the first to check out our latest products",
      buttonText: "Explore",
      imageUrl: "/images/hero-slide-3.jpg",
      link: "/new-arrivals"
    }
  ];

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: true,
    fade: true
  };

  return (
    <section className="hero-section">
      <Slider {...sliderSettings}>
        {heroSlides.map(slide => (
          <div key={slide.id} className="hero-slide">
            <div className="hero-slide-content">
              <h1 className="hero-title">{slide.title}</h1>
              <p className="hero-subtitle">{slide.subtitle}</p>
              <a href={slide.link} className="hero-button">
                {slide.buttonText}
              </a>
            </div>
            <div className="hero-image-container">
              <img 
                src={slide.imageUrl} 
                alt={slide.title} 
                className="hero-image" 
              />
            </div>
          </div>
        ))}
      </Slider>
    </section>
  );
};

export default Hero;