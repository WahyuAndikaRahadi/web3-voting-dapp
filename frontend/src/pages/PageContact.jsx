import emailjs from '@emailjs/browser';
import { useRef } from 'react';

const PageContact = () => {
  const form = useRef();

  const handleSubmit = (event) => {
    event.preventDefault();

    emailjs
      .sendForm('service_amj4b18', 'template_thzok5u', form.current, 'uj9vf0szqjqzPche7')
      .then(() => {
        alert('Thank you! Your message has been sent.');
        form.current.reset();
      })
      .catch((error) => {
        alert('Sorry, an error occurred. Please try again.');
        console.error('Error:', error);
      });
  };

  return (
    <section className="py-10 px-4 sm:px-6 md:px-8 lg:px-20 bg-gray-900 text-white">
      <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center md:text-left">
        <span className="text-blue-500">Contact</span> Us
      </h1>
      <div className="flex flex-col lg:flex-row lg:space-x-10 space-y-10 lg:space-y-0">
        <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-md w-full lg:w-1/2">
          <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
          <p className="text-white mb-6">For more information, you can contact us:</p>
          <form ref={form} onSubmit={handleSubmit} className="space-y-6">
            <div className="mb-4">
              <label className="block text-white mb-1">Name</label>
              <input
                type="text"
                name="user_name"
                placeholder="Enter Your Name"
                className="text-black w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-white mb-1">Email</label>
              <input
                type="email"
                name="user_email"
                placeholder="email@gmail.com"
                className="text-black w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-white mb-1">Message</label>
              <textarea
                name="message"
                placeholder="Type Your Message"
                className="text-black w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-green-500 text-white rounded-md hover:bg-green-700 transition duration-300"
            >
              Submit
            </button>
          </form>
        </div>

        <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-md w-full lg:w-1/2">
          <h2 className="text-xl font-semibold mb-4">Meet Us At</h2>
          <p className="text-white mb-2">
          Jl. Dr. KRT Radjiman Widyodiningrat No.32, RT.07/RW.7, Rawa Badung, Kec. Cakung, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta 13930
          </p>
          <p className="text-white mb-6">Phone Number: 0813-8877-2645</p>
          <div className="map mb-4">
            <iframe
              title="Map Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.4342287584636!2d106.92306417402486!3d-6.206312860792983!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e698bcabb1368d7%3A0xea46dd080cc5e54c!2sSMK%20NEGERI%2069%20JAKARTA!5e0!3m2!1sen!2sid!4v1730899643322!5m2!1sen!2sid"
              className="w-full h-48 md:h-64 lg:h-72 border-0 rounded-md"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PageContact;
