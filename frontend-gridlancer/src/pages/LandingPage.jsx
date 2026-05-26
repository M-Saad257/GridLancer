import React, { useEffect } from "react";
import Navbar from "../Global/Navbar";
import Hero from "../components/Hero";
import Trust from "../components/Trust";
import Features from "../components/Features";
import HowItWorks from "../components/HowItWorks";
import AdvancedUI from "../components/AdvancedUI";
import Pricing from "../components/Pricing";
import Testimonials from "../components/Testimonials";
import FinalCTA from "../components/FinalCTA";
import Footer from "../components/Footer";

const LandingPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full flex flex-col font-sans bg-slate-950 min-h-screen">
      <Navbar />
      <Hero />
      <Trust />
      <Features />
      <HowItWorks />
      <AdvancedUI />
      <Pricing />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default LandingPage;
