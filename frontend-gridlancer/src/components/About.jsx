import { Link } from "react-router-dom";

function About() {
  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[#3a1c71] to-[#d76d77] text-white font-sans">
      <h1 className="text-[38px] mb-4 font-bold drop-shadow-sm">About Page</h1>
      <Link
        to="/"
        className="bg-white text-[#333] px-5 py-2 rounded-lg font-bold transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:bg-gray-50"
      >
        Back to Home
      </Link>
    </div>
  );
}

export default About;