import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './Hero.css';
import image1 from '../assets/Rivers-State-University-1.jpeg'
import image2 from '../assets/IMG-20250306-WA0025.jpg'
import image3 from '../assets/rice.jpg'
import image4 from '../assets/IMG-20250306-WA0012.jpg'

const Hero = () => {
  // Sample hero slides data - replace with your actual data
  const heroSlides = [
    {
      id: 1,
      title: "Welcome Rivers State University Online Store",
      subtitle: "Discover amazing goods...",
      buttonText: "Shop Now",
      imageUrl: image1,
      link: "/summer-collection"
    },
    {
      id: 2,
      title: "Restaurants",
      subtitle: "Buy Food whereever you want.",
      buttonText: "Buy Now",
      imageUrl: image3,
      link: "/special-offers"
    },
    {
      id: 3,
      title: "Books/Stationaries",
      subtitle: "Discover Worlds In Books.",
      buttonText: "Order Now",
      imageUrl: image2,
      link: "/new-arrivals"
    },
    {
      id: 3,
      title: "Pharmacy",
      subtitle: "Get you Drugs prescription deliverd",
      buttonText: "Get Drugs",
      imageUrl: image4,
      link: "/new-arrivals"
    },
    {
      id: 3,
      title: "Supermarket/Goods Delivery",
      subtitle: "Shop from dusk till dawn.",
      buttonText: "Shop Now",
      imageUrl: image4,
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
            <div className="hero-background">
              <img 
                src={slide.imageUrl} 
                alt={slide.title} 
                className="hero-image" 
              />
            </div>
            <div className="hero-content">
              <div className="hero-text">
                <h1 className="hero-title">{slide.title}</h1>
                <p className="hero-subtitle">{slide.subtitle}</p>
                <a href={slide.link} className="hero-button">
                  {slide.buttonText}
                </a>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </section>
  );
};

export default Hero;