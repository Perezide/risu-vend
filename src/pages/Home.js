import React from 'react'
import Hero from '../components/Hero'
import PopularProducts from '../components/PopularProducts'
import ShopsByCategory from './ShopsByCategory'
import ProductReview from '../components/ProductReviews'
import ContactUs from '../components/ContactUs'
import Footer from '../components/Footer'

function Home() {
  return (
    <>
    <Hero />
    <PopularProducts />
    <ShopsByCategory />
    <ProductReview />
    <ContactUs />
    <Footer />
    </>
  )
}

export default Home